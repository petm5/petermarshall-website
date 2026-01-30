import fs from 'fs/promises'
import path from 'node:path'
import { CID } from 'multiformats/cid'
import { multiaddr } from '@multiformats/multiaddr'
import { base64 } from "multiformats/bases/base64"
import { base36 } from 'multiformats/bases/base36'
import { peerIdFromString } from '@libp2p/peer-id'

import site from '../src/lib/site.json' with { type: 'json' };

const webHost = new URL(site.baseUrl).host

const distDir = path.resolve('build')
const advertDir = path.join(distDir, 'ipni', 'v1', 'ad')

const indexerHost = 'cid.contact'
const delegatedRouterHost = 'delegated-ipfs.dev'

const provide = async () => {
  console.log(`🎁 Providing IPNI advertisement`)

  const advertCid = CID.parse(await fs.readFile(path.join(advertDir, 'head'), { encoding: 'utf8' }))
  const peerId = peerIdFromString(await fs.readFile(path.join(advertDir, 'id'), { encoding: 'utf8' }))

  const announceAddrs = [
    `/dns4/${webHost}/tcp/443/https/p2p/${peerId.toString()}`,
    `/dns6/${webHost}/tcp/443/https/p2p/${peerId.toString()}`
  ]

  console.log('🌐 Advertisement CID:', advertCid.toString())
  console.log('🌐 Announcing multiaddrs:', announceAddrs)

  const addrs = announceAddrs.map((a) => Buffer.from(multiaddr(a).bytes).toString('base64'))

  const payload = JSON.stringify({
    Cid: {
      '/': advertCid.toString(base64.encoder)
    },
    Addrs: addrs
  })

  const response = await fetch(`https://${indexerHost}/announce`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: payload
  })

  if (response.status != 204) {
    return console.warn('\n❌ Got error:', response.status, await response.text())
  }

  console.log('\n✅ Done!')

  console.log(`\n🎁 Providing IPNS advertisement`)

  const ipnsData = await fs.readFile(path.join(advertDir, 'ipns'))
  const ipnsName = peerId.toCID().toV1().toString(base36)

  console.log('🌐 IPNS name:', ipnsName)

  const ipnsResponse = await fetch(`https://${delegatedRouterHost}/routing/v1/ipns/${ipnsName}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/vnd.ipfs.ipns-record'
    },
    body: ipnsData
  })

  if (ipnsResponse.status != 200) {
    return console.warn('\n❌ Got error:', ipnsResponse.status, await ipnsResponse.text())
  }

  console.log('\n✅ Done!')
}

await provide().catch(console.error)
