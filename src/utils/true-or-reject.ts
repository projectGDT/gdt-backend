export async function trueOrReject(promise: Promise<boolean>) {
    return promise.then(result => result ? true : Promise.reject())
}