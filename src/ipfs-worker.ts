import type { ScheduledController, ExecutionContext } from '@cloudflare/workers-types'

import { sendIpniAnnouncement, type IpniAnnouncement } from '../src/lib/ipfs/ipni-announcement-sender'

declare const IPNI_ANNOUNCEMENT: IpniAnnouncement
declare const INDEXER_HOST: string

const ipniAnnouncement = IPNI_ANNOUNCEMENT
const indexerHost = new URL(INDEXER_HOST)

interface Env {}

export default {
  async scheduled(
    _controller: ScheduledController,
    _env: Env,
    ctx: ExecutionContext
  ) {
    console.log('Running scheduled IPNI refresh\n')
    ctx.waitUntil(sendIpniAnnouncement(ipniAnnouncement, indexerHost))
  },
}
