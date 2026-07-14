it('EVERY charge in the case appears in the packet — none dropped', () => {
  const inCase   = marcusRivera.incidents.flatMap(i => i.charges.map(c => c.id))
  const inPacket = packetPlan(marcusRivera, hvac).documents.flatMap(d => d.chargeIds)
  expect(new Set(inPacket)).toEqual(new Set(inCase))
}