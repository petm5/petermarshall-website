import * as esbuild from 'esbuild'

import fs from 'fs/promises'
import path from 'node:path'
import { CID } from 'multiformats/cid'
import { peerIdFromString } from '@libp2p/peer-id'

import { createIpniAnnouncement } from '../src/lib/ipfs/ipni-announcement'

import site from '../src/lib/site.json' with { type: 'json' };

const distDir = path.resolve('build')
const advertDir = path.join(distDir, 'ipni', 'v1', 'ad')

const advertCid = CID.parse(await fs.readFile(path.join(advertDir, 'head'), { encoding: 'utf8' }))
const peerId = peerIdFromString(await fs.readFile(path.join(advertDir, 'id'), { encoding: 'utf8' }))

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
    define: {
      IPNI_ANNOUNCEMENT: JSON.stringify(ipniAnnouncement),
      INDEXER_HOST: JSON.stringify(indexerHost.toString())
    }
  })
  console.log('⚡ Worker bundled successfully!');
}

build().catch(() => process.exit(1))
