import { IpfsProvider } from '../src/lib/ipfs/amino-provider.ts'
import { CID } from 'multiformats/cid'
import { privateKeyFromProtobuf } from '@libp2p/crypto/keys'
import { peerIdFromPrivateKey } from '@libp2p/peer-id'
import fs from 'fs/promises'
import path from 'path'

import site from '../src/lib/site.json' with { type: 'json' }

const distDir = path.resolve('build')
const blocksDir = path.join(distDir, 'ipfs');

const webHost = new URL(site.baseUrl).host

const addresses = [
  `/dns4/${webHost}/tcp/443/https`,
  `/dns6/${webHost}/tcp/443/https`
]

const rootCid = CID.parse(await fs.readFile(path.join(blocksDir, 'root'), { encoding: 'utf8' }))

const b64Key = process.env.IPFS_PRIVATE_KEY
if (!b64Key) throw new Error('Required variable IPFS_PRIVATE_KEY is missing')

const privKey = privateKeyFromProtobuf(Buffer.from(b64Key, 'base64'))

const peerId = peerIdFromPrivateKey(privKey)

console.log('🧬 Providing root CID to the Amino DHT...')
console.log(`🔑 Using PeerID: ${peerId}`)
console.log(`🌐 Root CID: ${rootCid.toString()}`)

await IpfsProvider.provide({
  cids: [rootCid],
  addresses,
  peerId,
})

console.log('✅ Done!')
