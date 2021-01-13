import axios from 'axios';

export class PhoneCall {
    constructor(
        // params
        private login: string,
        private password: string,
        private phones: string
    ) {}

    async doCall(message: string): Promise<void> {
        await axios.get('https://smsc.ru/sys/send.php', {
            params: {
                login: this.login,
                psw: this.password,
                phones: this.phones,
                mes: message,
                call: 1,
                voice: 'w',
                param: '20,10,3',
            },
        });
    }
}
