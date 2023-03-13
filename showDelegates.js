const fs = require('fs')

const dels = ["0xB2223F4038DEf8A62a86E3c4b108CDfE00a74C4f","0x664EAbE08871a7b7f13AdE88bc34605ed5EAEAE6","0xe400a85a6169bd8be439bb0dc9eac81f19f26843","0xd41308f50858da2b7cc641e493fbddf34775393a","0xAeD753D90b7C88103Fbee3Bf90DA4436C326D9E1","0xff3327cc139449fa111ad87351bb300e9cc7607c","0xc939519869C946E4BdCa8FD0B6459048c4aEBAe2","0x9dab43bc15bd29cfe3030ca1b7edb3eeb9f3b6c1","0xAEe59932F7f293DB8d56F5B60Be7713BCA27E7d7","0xffd3C4424c2CBdB1776572C4D136F15be66890aF","0x89a1D730AA1e78A0EdE8DEa988AcECfF0A6e99a9","0x9188872aBC65Cee15184fB9975de6a13730BdC74","0x26871b48edad35f81901ab9002e656e594397e7d","0x22ca65a6b15da45945e85949cf731d49ea52224b"]
const delegates = JSON.parse(fs.readFileSync('delegates.json', 'utf8'))
console.log(`Parsed ${delegates.length} delegates. Each one has this format:`)
const delByAddress = {}
for (var del of delegates) {
  delByAddress[del.address] = del
}

for (var del of dels) {
  const e = delByAddress[del]
  console.log(`${e.address} (${e.bio})`)
}
