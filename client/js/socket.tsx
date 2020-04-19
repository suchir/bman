import {InitInfo} from "./game";
import {Keys, MessageTypes} from "./consts";

class Socket {
    private username: string;
    private userid: number;
    private gameid: number;
    private sock: WebSocket;

    constructor(initInfo: InitInfo) {
        this.username = initInfo.username;
        this.userid = initInfo.userid;
        this.gameid = initInfo.gameid;
        this.sock = null;

        this.connect();
        this.setupSocket();
    }

    setupSocket() {
        this.sock.binaryType = "arraybuffer";
        let byteBuf = new ArrayBuffer(1000);
        let bytesInBuf = 0;
        this.sock.onmessage = function(event: MessageEvent) {
            let data = event.data as ArrayBuffer;
            // console.log("event length: " + data.byteLength + ", msg: " + new Uint8Array(data));
            let dataView = new Uint8Array(data);
            let bufView = new Uint8Array(byteBuf, bytesInBuf, byteBuf.byteLength - bytesInBuf);
            for (let i = 0; i < data.byteLength; i++) {
                bufView[i + bytesInBuf] = dataView[i];
            }
            bytesInBuf += data.byteLength;

            let bytesRead = 0;

            while (bytesInBuf - bytesRead > 5) {
                let view = new DataView(byteBuf, bytesRead, bytesInBuf - bytesRead);
                let messageLength = view.getUint32(1, false);
                if (bytesInBuf - 5 >= messageLength) {
                    // now we can read!
                    let messageType = new Uint8Array(byteBuf)[bytesRead];

                    let timestampFirstHalf = view.getUint32(bytesRead + 5, false);
                    let timestampSecondHalf = view.getUint32(bytesRead + 9, false);
                    let timestamp = timestampFirstHalf * Math.pow(2, 32) + timestampSecondHalf;
                    let content = byteBuf.slice(bytesRead + 13, bytesRead + messageLength + 5);
                    // console.log("event messageType: " + messageType + " messageLength: " + messageLength + " timestamp: " + timestamp + " content: " + new Uint8Array(content));

                    bytesRead += messageLength + 5;
                }
            }

            if (bytesRead != 0) {
                let zeroView = new Uint8Array(byteBuf, 0, byteBuf.byteLength);
                let copyView = new Uint8Array(byteBuf, bytesRead, bytesInBuf - bytesRead);
                for (let i = 0; i < copyView.byteLength; i++) {
                    zeroView[i] = copyView[i + bytesRead];
                }
            }

            bytesInBuf -= bytesRead;
        }.bind(this);
    }

    connect(): boolean {
        let params = {
            userId: this.userid.toString(),
            name: this.username,
            gameId: this.gameid.toString(),
        };
        let paramsStr = new URLSearchParams(params).toString();
        let url = new URL('/ws?' + paramsStr, window.location.href);
        url.protocol = url.protocol.replace('http', 'ws');
        this.sock = new WebSocket(url.toString());
        return true; // todo return false if connection failure
    }

    connected(): boolean {
        return this.sock != null;
    }

    sendPlayerAction(action: Map<number, boolean>) {
        let actionByte = 0;
        if (action.get(Keys.UP)) actionByte |= 1;
        if (action.get(Keys.DOWN)) actionByte |= 1 << 1;
        if (action.get(Keys.LEFT)) actionByte |= 1 << 2;
        if (action.get(Keys.RIGHT)) actionByte |= 1 << 3;
        if (action.get(Keys.BOMB)) actionByte |= 1 << 4;
        let buf = new ArrayBuffer(5);
        let bufView = new DataView(buf);
        bufView.setUint32(0, this.userid);
        bufView.setUint8(4, actionByte);
        this.sendMessage(MessageTypes.CLIENT_ACTION, buf);
    }

    private sendMessage(messageId: number, message: ArrayBuffer) {
        let header = new ArrayBuffer(13);
        let headerView = new DataView(header);
        headerView.setUint8(0, messageId);
        headerView.setUint32(1, message.byteLength + 8, false);

        let timestamp = Date.now();
        let timestampFirstHalf = Math.floor(timestamp / Math.pow(2, 32));
        let timestampSecondHalf = Math.floor(timestamp % Math.pow(2, 32));
        headerView.setUint32(5, timestampFirstHalf, false);
        headerView.setUint32(9, timestampSecondHalf, false);
        this.sock.send(header);
        this.sock.send(message);
    }
}

export default Socket;
