class Helper {
    getFormattedTime (getDateToo) {
        let now = new Date();

        let hours = now.getHours().toString().padStart(2, '0');
        let minute = now.getMinutes().toString().padStart(2, '0');
        let seconds = now.getSeconds().toString().padStart(2, '0');
        let millisecs = now.getMilliseconds().toString().padStart(3, '0');

        let result = `${hours}:${minute}:${seconds}::${millisecs}`;
        if (getDateToo) {
            let year = now.getFullYear().toString();
            let month = (now.getMonth() + 1).toString().padStart(2, '0');
            let day = now.getDate().toString().padStart(2, '0');
            result = `${year}-${month}-${day}.` + result;
        }
        return result;
    }

    getDateFormatted (date) {
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
    }

    getPadded (obj, padAmount) {
        return obj.toString().padStart(padAmount, ' ');
    }

    async sleep (ms) {
        await new Promise(r => setTimeout(r, ms));
    }

    isModN (index, num) {
        return (index % num) === 0;
    }

    getWaitTime (index, defaultWaitTime) {
        let result = defaultWaitTime;
        if (index > 0) {

            if (this.isModN(index, 10)) {
                result = 2048;

                if (this.isModN(index, 20)) {
                    result = 4096;
                }

                if (this.isModN(index, 50)) {
                    result = 8192;
                }

                if (this.isModN(index, 100) || this.isModN(index, 150) || this.isModN(index, 300)) {
                    result = 16384;
                }

                if (this.isModN(index, 500)) {
                    result = 32768;
                }

                if (this.isModN(index, 1000) || this.isModN(index, 1500)) {
                    result = 65536;
                }

                if (this.isModN(index, 2000)) {
                    result = 131072;
                }

            } else if (this.isModN(index, 4)) {
                //result = 4096;

                if (this.isModN(index, 8)) {
                    result = 1024;
                }

                if (this.isModN(index, 16)) {
                    result = 2048;
                }

                if (this.isModN(index, 32)) {
                    result = 4096;
                }
                if (this.isModN(index, 64)) {
                    //result = 16384;
                    result = 8192;
                }

                if (this.isModN(index, 256) || this.isModN(index, 512)) {
                    result = 16384;
                }
            }

            // if (result >= 1024) {
            //     console.log(`index: [${index}] -> long wait (${result})`);
            // }

        }
        return result;
    }

    getRandom (min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }
}

window.helper = new Helper();