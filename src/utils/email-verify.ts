import {preRegistries} from "../event/event-base";
import {ImapFlow} from "imapflow";

const checkMailboxInterval = 10000;  // check for new verification emails every 10 seconds

const client = new ImapFlow({
    host: process.env.EMAIL_HOST!,
    port: parseInt(process.env.EMAIL_PORT ?? "993"),
    secure: true,
    auth: {
        user: process.env.EMAIL_USERNAME!,
        pass: process.env.EMAIL_PASSWORD!
    },
    logger: false
});

client.connect().then(_res => setInterval(async () => {
    let lock = await client.getMailboxLock('INBOX');
    const messagesToDelete: number[] = [];
    try {
        for await (let message of client.fetch(`1:*`, {envelope: true})) {
            const qid = (message.envelope.from[0].address as string).split('@')[0];
            const passkey = message.envelope.subject;
            preRegistries.emit(`${qid}.${passkey}`, true);
            messagesToDelete.push(message.uid);
        }
    } finally {
        for (let uid of messagesToDelete) {
            await client.messageDelete({uid: uid.toString()});
        }
        lock.release();
    }
}, checkMailboxInterval));