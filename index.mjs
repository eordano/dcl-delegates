import fs from 'fs'
import csv from 'fast-csv'
import inquirer from 'inquirer';

async function main() {
  // Parse delegates json
  const delegates = JSON.parse(fs.readFileSync('delegates.json', 'utf8'))
  console.log(`Parsed ${delegates.length} delegates. Each one has this format:`)
  console.dir(delegates[0])
  // Parse Proposals CSV
  const proposals = await new Promise(resolve => {
    const p = []
    fs.createReadStream('proposals.csv')
      .pipe(csv.parse({ headers: true }))
      .on('data', row => {
        p.push(row);
      })
      .on('end', () => {
        resolve(p)
      });
  }).then(ps => {
    const proposalsByTitle = {}
    for (let p of ps) {
      if (!proposalsByTitle[p.Title] || proposalsByTitle[p.Title].Votes < p.Votes) {
        proposalsByTitle[p.Title] = p
      }
    }
    return Object.values(proposalsByTitle)
  })
  console.log(`Parsed ${proposals.length} proposals from a CSV. Each one has this format:`);
  const proposalsByTitle = {}
  for (let proposal of proposals) {
    proposalsByTitle[proposal["Title"]] = proposal
    proposal.VoteCount = proposal.Votes
    proposal.Votes = {}
    proposal.ChoiceName = {}
  }
  console.log(proposals[0])
  
  // Parse Votes CSV
  const votes = await new Promise(resolve => {
    const v = []
    fs.createReadStream('votes.csv')
      .pipe(csv.parse({ headers: true }))
      .on('data', row => {
        v.push(row);
      })
      .on('end', () => {
        resolve(v)
      });
  })
  for (let vote of votes) {
    const proposal = proposalsByTitle[vote["Proposal Title"]]
    if (proposal) {
      proposal.Votes[vote.Member] = vote
      proposal.ChoiceName[vote['Choice #']] = vote['Choice']
    }
  }
  let count = 0
  for (let proposal of proposals) {
    count += Object.keys(proposal.Votes).length
  }
  console.log(`Parsed ${votes.length} votes (and correlated ${count} to proposals). Each one has this format:`)
  console.dir(votes[3230])

  // const answers = await inquirer.prompt([{
  //   type: 'input',
  //   name: 'ethAddress',
  //   message: 'What is your Ethereum address?',
  // }])
  // console.log('Your Ethereum address is:', answers.ethAddress)

  let targetCandidates = delegates
  const DESIRED_CANDIDATES = 10
  while (targetCandidates.length > DESIRED_CANDIDATES) {
    console.log(`Splitting between ${JSON.stringify(targetCandidates.map(_ => _.address))}`)
    console.log(`Splitting between ${targetCandidates.length}. Next question:`)
    targetCandidates = await filterDelegatesByPromptingUser(proposals, targetCandidates)
  }
  async function filterDelegatesByPromptingUser(proposals, delegates) {
    const proposalsByScore = proposals.filter(p => p.VoteCount > 30).map(proposal => {
      return {
        proposal,
        ...scoreOfProposal(proposal, delegates)
      }
    }).sort((a, b) => b.score - a.score)
    const proposalWithScore = proposalsByScore[0]
    const answer = await inquirer.prompt({
      type: 'list',
      name: 'vote',
      message: `What would you vote on "${proposalWithScore.proposal.Title}"?\nhttps://governance.decentraland.org/proposal/?id=${proposalWithScore.proposal['Proposal ID']} (score: ${proposalWithScore.score})`,
      choices: Object.keys(proposalWithScore.votes).map(_ => proposalWithScore.proposal.ChoiceName[_])
    })
    return delegates.filter(delegate => {
      const vote = proposalWithScore.proposal.Votes[delegate.address]
      return !vote || vote.Choice === answer.vote
    })
  }
  /**
   * Returns the score of a proposal to split the set of delegates, measured
   * by the difference between the maximum subset of voters and minimum subset
   * of voters by selecting a choise
   */
   function scoreOfProposal(proposal, delegates) {
     const setsOfDelegatesByChoice = {}
     let voters = 0
     for (let delegate of delegates) {
       const address = delegate.address
       const vote = proposal.Votes[address]
       const choice = vote ? vote['Choice #'] : 'undefined'
       if (vote) {
         voters += 1
       }
       setsOfDelegatesByChoice[choice] = setsOfDelegatesByChoice[choice] || []
       setsOfDelegatesByChoice[choice].push(address)
     }
     delete setsOfDelegatesByChoice['undefined']
     // Everybody voted the same
     if (Object.values(setsOfDelegatesByChoice).length <= 1) {
       return {
         score: 0,
         votes: setsOfDelegatesByChoice
       }
     }
     let min = Infinity, max = 0
     for (let val of Object.values(setsOfDelegatesByChoice)) {
       min = Math.min(min, val.length)
       max = Math.max(max, val.length)
     }
     return {
       score: max - min,
       votes: setsOfDelegatesByChoice
     }
   }
}
main().catch(err => console.log(err))
