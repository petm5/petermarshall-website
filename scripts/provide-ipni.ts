import fs from 'fs/promises'
import path from 'node:path'
import { CID } from 'multiformats/cid'
import { peerIdFromString } from '@libp2p/peer-id'

import { createIpniAnnouncement } from '../src/lib/ipfs/ipni-announcement'
import { sendIpniAnnouncement } from '../src/lib/ipfs/ipni-announcement-sender'
import { provideIpnsRecord } from '../src/lib/ipfs/delegated-router-provide-ipns'

import site from '../src/lib/site.json' with { type: 'json' };

const webHost = new URL(site.baseUrl)

const distDir = path.resolve('build')
const advertDir = path.join(distDir, 'ipni', 'v1', 'ad')

const indexerHost = new URL('https://cid.contact')
const delegatedRouterHost = new URL('https://delegated-ipfs.dev')

const advertCid = CID.parse(await fs.readFile(path.join(advertDir, '_ad'), { encoding: 'utf8' }))
const peerId = peerIdFromString(await fs.readFile(path.join(advertDir, '_id'), { encoding: 'utf8' }))

const ipnsData = (await fs.readFile(path.join(advertDir, '_ipns'))).buffer

const ipniAnnouncement = createIpniAnnouncement({ advertCid, peerId, webHost })

await sendIpniAnnouncement(ipniAnnouncement, indexerHost).catch(console.error)

await provideIpnsRecord({ ipnsData, ipnsName: peerId.toCID(), delegatedRouterHost }).catch(console.error)
