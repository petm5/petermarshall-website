import * as esbuild from 'esbuild'

import fs from 'fs/promises'
import path from 'node:path'
import { CID } from 'multiformats/cid'
import { peerIdFromString } from '@libp2p/peer-id'

import { createIpniAnnouncement } from '../src/lib/ipfs/ipni-announcement'

import site from '../src/lib/site.json' with { type: 'json' };

const distDir = path.resolve('build')
const ipfsDir = path.join(distDir, 'ipfs')
const advertDir = path.join(distDir, 'ipni', 'v1', 'ad')

const advertCid = CID.parse(await fs.readFile(path.join(advertDir, '_ad'), { encoding: 'utf8' }))
const peerId = peerIdFromString(await fs.readFile(path.join(advertDir, '_id'), { encoding: 'utf8' }))
const rootCid = CID.parse(await fs.readFile(path.join(ipfsDir, 'root'), { encoding: 'utf8' }))

const b64Key = process.env.IPFS_PRIVATE_KEY
if (!b64Key) throw new Error('Required variable IPFS_PRIVATE_KEY is missing')

const webHost = new URL(site.baseUrl)

const indexerHost = new URL('https://cid.contact')

const ipniAnnouncement = createIpniAnnouncement({ advertCid, peerId, webHost })

async function build() {
  console.log('📦 Bundling IPFS worker')
  await esbuild.build({
    entryPoints: ['src/ipfs-worker.ts'],
    bundle: true,
    outfile: 'dist/ipfs-worker.js',
    format: 'esm',
    platform: 'browser',
    target: 'esnext',
    minify: true,
    treeShaking: true,
    external: ['cloudflare:workers'],
    define: {
      IPNI_ANNOUNCEMENT: JSON.stringify(ipniAnnouncement),
      INDEXER_HOST: JSON.stringify(indexerHost.toString()),
      ROOT_CID: JSON.stringify(rootCid.toString()),
      IPFS_PRIVATE_KEY: JSON.stringify(b64Key),
    }
  })
  console.log('⚡ Worker bundled successfully!');
}

build().catch(() => process.exit(1))
