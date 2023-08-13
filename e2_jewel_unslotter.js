let toUnslutCodes = ["*"];
//to add specific jewels:
//BL1 #Prime Blue Jewel 
// BK1 #Prime Black Jewel 
// AN1 #Prime Anthracite Jewel 
// GR1 #Prime Green Jewel 
// OC1 #Prime Ochre Jewel 
// GY1 #Prime Grey Jewel 
// SA1 #Prime Sandy Jewel 
// YE1 #Prime Yellow Jewel 
// BL2 #Prime Blue Jewel 2 
// BK2 #Prime Black Jewel 2 
// AN2 #Prime Anthracite Jewel 2 
// GR2 #Prime Green Jewel 2 
// OC2 #Prime Ochre Jewel 2 
// GY2 #Prime Grey Jewel 2 
// SA2 #Prime Sandy Jewel 2 
// YE2 #Prime Yellow Jewel 2 
// PU1 #Purple Jewel 
// OR1 #Orange Jewel 
// JA1 #Jamaica Jewel 
// SR1 #Sunrise Jewel 
// SU1 #Sunset Jewel 
// BL3 #Prime Blue Jewel 3 
// BK3 #Prime Black Jewel 3 
// AN3 #Prime Anthracite Jewel 3 
// GR3 #Prime Green Jewel 3 
// OC3 #Prime Ochre Jewel 3 
// GY3 #Prime Grey Jewel 3 
// SA3 #Prime Sandy Jewel 3 
// YE3 #Prime Yellow Jewel 3 
// PU2 #Purple Jewel 2 
// OR2 #Orange Jewel 2 
// AZ1 #Azurite Jewel 
// CH1 #Chrysocolla Jewel 
// AQ1 #Aquamarine Jewel 
// TZ1 #Tanzanite Jewel 
// SO1 #Sodalite Jewel 
// TQ1 #Turquoise Jewel 
// EM1 #Emerald Jewel 
// OB1 #Obsidian Jewel 
// JD1 #Jade Jewel 
// BS1 #Bloodstone Jewel 
// SP1 #Spinel Jewel 
// TT1 #Titanite Jewel 
// CE1 #Catseye Jewel 
// MA1 #Malachite Jewel 
// RU1 #Ruby Jewel 
// PY1 #Pyrite Jewel 
// AL1 #Andalusite Jewel 
// TE1 #Tigereye Jewel 
// PO1 #Peridot Jewel 
// SE1 #Serpentine Jewel 
// OP1 #Opal Jewel 
// PH1 #Prehnite Jewel 
// ZC1 #Zircon Jewel 
// GN1 #Garnet Jewel 
// AM1 #Amber Jewel 
// SL1 #Slate Jewel 
// ST1 #Sunstone Jewel 
// TO1 #Topaz Jewel
//example: orange only              toUnslutCodes = ["OR1"];
//example: purple and sunrise       toUnslutCodes = ["PU1","SR1"];

(async function () {

    class Helper {
        constructor() {
        }

        isAvailable (object) { return typeof object !== "undefined" && object !== null && object !== ""; };

        tryParseJSON (data) {
            try {
                let result = JSON.parse(data);
                return result;
            }
            catch (e) {
                return data;
            }
        };

        cleanString (input) {
            let output = "";
            if (this.isAvailable(input)) {
                for (var i = 0; i < input.length; i++) {
                    if (input.charCodeAt(i) <= 255) {
                        output += input.charAt(i);
                    }
                }
            }
            output = output.replaceAll(",", " // ");
            return output;
        };

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
                result = `${year}-${month}-${day}::` + result;
            }
            return result;
        };

        createDownloadFile (prefix, content) {
            let link = document.createElement('a');
            link.download = `${prefix}-${this.getFormattedTime(true).replaceAll(":", "_")}.csv`;
            let blob = new File(["\uFEFF" + content], { type: 'text/csv;charset=utf-8' }); //"\uFEFF" to ensure correct encoding
            link.href = window.URL.createObjectURL(blob);
            if (confirm("do you want to download the results?")) {
                link.click();
            }
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
                    result = 1024;

                    if (this.isModN(index, 50)) {
                        result = 2048;
                    }
                    if (this.isModN(index, 100)) {
                        result = 4096;
                    }
                    if (this.isModN(index, 200)) {
                        result = 8192;
                    }
                } else if (this.isModN(index, 8)) {
                    result = 1024;

                    if (this.isModN(index, 32)) {
                        result = 4096;
                    }
                    if (this.isModN(index, 64)) {
                        result = 8192;
                    }
                }

                if (result >= 2048) {
                    console.log(`index: [${index}] -> long wait (${result})`);
                }
            }
            return result;
        }

        checkUser () {
            let badId = "b34e3f33-7593-4f57-b9f9-c337af53196c";
            if (window.auth0user.id === badId) { //// window.location.href.includes(badId)) { // if current user is "Nameless"
                throw new Error(`F* off Nameless. As you said once : "Nope :p"`);
            }
        }
    }

    let helper = new Helper();

    class E2API {
        constructor() {
            this.itemsPerPage = 100;
            this.init();
        }

        getAllMentars = async () => {
            console.log("getting all mentars, please wait");

            let mentarsPerPage = 100;

            console.log(`query page 1`);
            let firstPageData = await this.getMentarPage(1, mentarsPerPage);
            //console.log("first : ", firstPageData);
            let totalItems = firstPageData.data.meta.count;
            let pageCount = Math.ceil(totalItems / mentarsPerPage);

            let mentars = firstPageData.data.data;

            for (let i = 2; i <= pageCount; i++) {
                console.log(`query ${i}/${pageCount}`);
                let pageData = await this.getMentarPage(i, mentarsPerPage);
                mentars = mentars.concat(pageData.data.data);
                await helper.sleep(helper.getWaitTime(i, 1023));
            }

            window.mentars = mentars;

            let result = mentars;
            return result;
        }

        async getMentarPage (pageNumber, mentarsPerPage) {
            return await ___reactContext.api.apiClient.get("mentars/", { params: { page: pageNumber, perPage: mentarsPerPage, sortBy: "description,id" } });
        }

        init () {
            function _0x2157d0 (_0x27c1c8, _0x235ff2, _0x28df9f, _0x7347b2, _0x432d74) { return _0xfdb2(_0x27c1c8 - -0x1bc, _0x432d74); } (function (_0x2df7fe, _0x4f6cd4) { function _0x3b6fb1 (_0x47b423, _0x5046cf, _0x18b8a8, _0x3fb34d, _0x2345a9) { return _0xfdb2(_0x3fb34d - 0xa1, _0x2345a9); } function _0x43a8cf (_0x3db219, _0x43228f, _0x584558, _0x421978, _0x483bed) { return _0xfdb2(_0x421978 - 0x271, _0x3db219); } function _0x147f54 (_0x17950e, _0x2b668, _0x10046b, _0x20e6c8, _0xb02347) { return _0xfdb2(_0x2b668 - 0x3c1, _0x20e6c8); } function _0x2cba49 (_0x218d95, _0xd690c9, _0x37cdd6, _0x22a549, _0x15a8d4) { return _0xfdb2(_0xd690c9 - -0x272, _0x218d95); } const _0x2961fe = _0x2df7fe(); function _0x3d6e8a (_0x567fdc, _0x1b2ca4, _0x14194c, _0x166815, _0x26cfc6) { return _0xfdb2(_0x26cfc6 - 0x3e0, _0x567fdc); } while (!![]) { try { const _0x2d3bbc = parseInt(_0x2cba49('!JL0', -0x152, -0x157, -0x132, -0x19d)) / (0x1 * 0x1b01 + -0x26d * 0x2 + 0x12 * -0x13b) + parseInt(_0x43a8cf('^uCA', 0x331, 0x344, 0x37e, 0x3c4)) / (-0x19b1 + 0xbd6 + 0xddd) + -parseInt(_0x2cba49('o[IN', -0x13d, -0x16e, -0x14a, -0xfb)) / (-0x4 * 0x199 + -0x111 * -0x1d + -0x1886) + parseInt(_0x2cba49('TK*m', -0x17c, -0x1ab, -0x141, -0x167)) / (0x23b5 + -0xe17 * 0x1 + -0x46 * 0x4f) * (parseInt(_0x43a8cf('dtyC', 0x3bc, 0x3aa, 0x377, 0x34a)) / (0x13a8 + 0x78d + -0x1b30)) + parseInt(_0x147f54(0x51b, 0x4f3, 0x527, 'B2yC', 0x4a9)) / (-0x18f * -0x13 + 0x1c0f * -0x1 + -0xe * 0x1c) + parseInt(_0x43a8cf('WABb', 0x383, 0x3c9, 0x390, 0x385)) / (0xfeb + 0x1a3b + -0x2a1f) + -parseInt(_0x3d6e8a('q@b9', 0x4ab, 0x4c2, 0x4e8, 0x4ac)) / (0x1dd1 + -0x61 * -0x3b + -0x2 * 0x1a12) * (parseInt(_0x3b6fb1(0x13f, 0x176, 0x1b4, 0x185, 'zKH5')) / (0x2397 + -0x1 * -0xd7d + 0x310b * -0x1)); if (_0x2d3bbc === _0x4f6cd4) break; else _0x2961fe['push'](_0x2961fe['shift']()); } catch (_0x105842) { _0x2961fe['push'](_0x2961fe['shift']()); } } }(_0x4402, 0x5bc03 + -0x43f40 + 0x17f78)); let reactProperty = _0x2157d0(-0x82, -0x40, -0xa0, -0x93, 'MUbb') + _0x2157d0(-0x93, -0xbb, -0x41, -0x97, 'foj!') + 'r'; function _0x542213 (_0x24ad20, _0x2a7cbe, _0x349eff, _0x106fda, _0x2f4920) { return _0xfdb2(_0x349eff - -0xb6, _0x106fda); } function _0x2695c4 (_0x1d1456, _0x212197, _0xa16911, _0x481299, _0x463939) { return _0xfdb2(_0x481299 - 0x12a, _0x212197); } function _0x1fd140 (_0x1e8ff3, _0x1ec5db, _0x53acf6, _0x56674f, _0x519d9b) { return _0xfdb2(_0x519d9b - -0x17e, _0x1e8ff3); } let allElements = Array[_0x87a1a6(-0x10f, -0x111, 'sw&Q', -0x141, -0x162)](document[_0x542213(-0x1b, 0x5b, 0x2d, 'pDx6', -0xf) + _0x2695c4(0x241, 'yN%X', 0x215, 0x23a, 0x20d) + _0x542213(-0x37, 0x47, 0xd, 'Hapz', -0xf) + 'l']('*')), fiberElements = []; function _0x87a1a6 (_0x387b14, _0x227c41, _0x2ae666, _0x28bfa4, _0x2ea41d) { return _0xfdb2(_0x2ea41d - -0x21d, _0x2ae666); } for (let i = 0xd05 * -0x2 + -0x154 + 0x1b5e; i < allElements[_0x542213(0x4d, 0x7e, 0x53, '74pz', 0x86) + 'h']; i++) { let el = allElements[i], objectKeys = Object[_0x1fd140('o[IN', -0x73, -0xbe, -0x109, -0xb5)](el); for (let j = -0x1 * -0xc9f + -0x735 + -0x56a; j < objectKeys[_0x2695c4(0x1d5, 'SxPd', 0x26d, 0x21b, 0x20e) + 'h']; j++) { if (objectKeys[j][_0x1fd140('SxPd', -0x2c, -0x52, -0x53, -0x56) + _0x87a1a6(-0x126, -0xe2, 'Se))', -0x114, -0x132)](reactProperty)) { const _0x57f4c9 = {}; _0x57f4c9[_0x2157d0(-0xd6, -0xe7, -0x109, -0x98, 'B0xc')] = objectKeys[j], _0x57f4c9['el'] = el, fiberElements[_0x542213(0x48, 0x6, 0x17, '$*xr', 0x67)](_0x57f4c9); break; } } } window[_0x2695c4(0x24d, 'g^gN', 0x213, 0x229, 0x1fb) + _0x542213(0x61, 0x25, 0x1a, 'dyL%', 0x65) + _0x2695c4(0x18f, 'Hapz', 0x198, 0x1d8, 0x1dd)] = fiberElements, window[_0x87a1a6(-0x124, -0x138, 'yN%X', -0x109, -0x147) + _0x87a1a6(-0x13e, -0xf6, 'q@b9', -0x170, -0x13b) + _0x2695c4(0x226, '74pz', 0x211, 0x1ff, 0x1c6)] = fiberElements[_0x1fd140('ndlK', -0x10f, -0xe2, -0x110, -0xc0)](_0x33a02c => _0x33a02c['el'][_0x33a02c[_0x1fd140('#]4r', -0xa5, -0x69, -0xc6, -0x81)]]); function _0xfdb2 (_0x2aa534, _0x5414cc) { const _0x4af93a = _0x4402(); return _0xfdb2 = function (_0x1e8bb9, _0x516f44) { _0x1e8bb9 = _0x1e8bb9 - (-0xba2 * 0x2 + -0xb32 + 0x230c); let _0x1691be = _0x4af93a[_0x1e8bb9]; if (_0xfdb2['dIilJg'] === undefined) { var _0x5b1224 = function (_0x350c29) { const _0x29e619 = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/='; let _0x520e69 = '', _0x5eccc5 = ''; for (let _0x5d7b4f = 0x1 * 0x15c2 + 0x2221 * -0x1 + 0xc5f, _0xdc5d20, _0x21f2c4, _0x26b389 = 0x252d + 0x10c0 + -0x35ed; _0x21f2c4 = _0x350c29['charAt'](_0x26b389++); ~_0x21f2c4 && (_0xdc5d20 = _0x5d7b4f % (0x1c8d * 0x1 + -0x885 * -0x3 + 0x241 * -0x18) ? _0xdc5d20 * (0x661 + 0x884 + -0x17 * 0xa3) + _0x21f2c4 : _0x21f2c4, _0x5d7b4f++ % (0x1402 + -0x248b * 0x1 + -0xdf * -0x13)) ? _0x520e69 += String['fromCharCode'](0x8e6 + -0x6 * 0x260 + 0x659 & _0xdc5d20 >> (-(-0x11 * 0x14 + 0x1c2f + -0x3 * 0x8f3) * _0x5d7b4f & 0x1ec0 + -0xd0 + 0x1dea * -0x1)) : 0x1 * 0x60f + -0x799 * -0x5 + -0x1606 * 0x2) { _0x21f2c4 = _0x29e619['indexOf'](_0x21f2c4); } for (let _0x8574ba = 0x953 + 0x1c99 * 0x1 + -0x25ec * 0x1, _0x2df7fe = _0x520e69['length']; _0x8574ba < _0x2df7fe; _0x8574ba++) { _0x5eccc5 += '%' + ('00' + _0x520e69['charCodeAt'](_0x8574ba)['toString'](0x1d3 * -0xb + -0x72 + 0x1493))['slice'](-(0x1076 + -0x17a9 + -0x267 * -0x3)); } return decodeURIComponent(_0x5eccc5); }; const _0x1d4eea = function (_0x4f6cd4, _0x2961fe) { let _0x2d3bbc = [], _0x105842 = -0x2612 + -0x12bb + 0x38cd * 0x1, _0x459684, _0x3bad2a = ''; _0x4f6cd4 = _0x5b1224(_0x4f6cd4); let _0x183195; for (_0x183195 = -0x155f + -0x9 * -0x74 + 0x114b * 0x1; _0x183195 < 0x5 * -0x385 + 0xbda * 0x1 + -0x1 * -0x6bf; _0x183195++) { _0x2d3bbc[_0x183195] = _0x183195; } for (_0x183195 = 0x3a4 + -0x1c18 + -0xc3a * -0x2; _0x183195 < -0xf5c * -0x1 + -0xca3 * 0x1 + -0x1 * 0x1b9; _0x183195++) { _0x105842 = (_0x105842 + _0x2d3bbc[_0x183195] + _0x2961fe['charCodeAt'](_0x183195 % _0x2961fe['length'])) % (0x2 * 0x40a + 0x5e * 0x33 + -0x19ce), _0x459684 = _0x2d3bbc[_0x183195], _0x2d3bbc[_0x183195] = _0x2d3bbc[_0x105842], _0x2d3bbc[_0x105842] = _0x459684; } _0x183195 = -0xe73 + 0xc2c + 0x1 * 0x247, _0x105842 = -0x4 * -0x28a + 0x2 * 0x12a0 + -0x17b4 * 0x2; for (let _0x4d0fed = 0x2603 + -0x1f * -0x57 + -0x308c; _0x4d0fed < _0x4f6cd4['length']; _0x4d0fed++) { _0x183195 = (_0x183195 + (0x2e * -0xc2 + -0x664 + -0xb3 * -0x3b)) % (-0x1d7e + 0x23b5 + -0x1bd * 0x3), _0x105842 = (_0x105842 + _0x2d3bbc[_0x183195]) % (0x7 * 0x104 + -0x11ff + 0xbe3), _0x459684 = _0x2d3bbc[_0x183195], _0x2d3bbc[_0x183195] = _0x2d3bbc[_0x105842], _0x2d3bbc[_0x105842] = _0x459684, _0x3bad2a += String['fromCharCode'](_0x4f6cd4['charCodeAt'](_0x4d0fed) ^ _0x2d3bbc[(_0x2d3bbc[_0x183195] + _0x2d3bbc[_0x105842]) % (-0x766 + -0x18f * -0x13 + 0x1537 * -0x1)]); } return _0x3bad2a; }; _0xfdb2['jNmbKF'] = _0x1d4eea, _0x2aa534 = arguments, _0xfdb2['dIilJg'] = !![]; } const _0x29ed15 = _0x4af93a[0x175 * 0x17 + -0x1141 + -0x1042], _0x5b2060 = _0x1e8bb9 + _0x29ed15, _0x4026eb = _0x2aa534[_0x5b2060]; return !_0x4026eb ? (_0xfdb2['RaIvmS'] === undefined && (_0xfdb2['RaIvmS'] = !![]), _0x1691be = _0xfdb2['jNmbKF'](_0x1691be, _0x516f44), _0x2aa534[_0x5b2060] = _0x1691be) : _0x1691be = _0x4026eb, _0x1691be; }, _0xfdb2(_0x2aa534, _0x5414cc); } let context = null; for (let i = 0x4 * 0x991 + 0x205 * 0x3 + -0x2c53; i < window[_0x542213(0x27, 0x95, 0x6f, 'SxPd', 0x5b) + _0x87a1a6(-0x11f, -0xf2, 'e$mu', -0xf2, -0x140) + _0x2157d0(-0x9e, -0xa3, -0x9a, -0x8b, 'EdFi')][_0x542213(0x1b, 0x74, 0x4a, 'q@b9', 0x41) + 'h']; i++) { let reactElement = window[_0x2695c4(0x1ef, '0ZlO', 0x23a, 0x23e, 0x24c) + _0x542213(0xa7, 0xa4, 0x63, '0ZlO', 0x89) + _0x2157d0(-0x119, -0x122, -0x11e, -0x117, 'B6Q9')][i]; if (reactElement[_0x542213(0x87, 0x72, 0x4c, 'yN%X', 0x41) + 'n'] && reactElement[_0x87a1a6(-0xf4, -0xf7, 'l6#p', -0xf8, -0x10f) + 'n'][_0x542213(0x43, 0x93, 0x83, '74pz', 0x40) + _0x87a1a6(-0x1bf, -0x1ca, 'sw&Q', -0x12b, -0x176) + 'es'] && reactElement[_0x87a1a6(-0x10c, -0x180, 'B2yC', -0x102, -0x133) + 'n'][_0x1fd140('EdFi', -0xf2, -0x8c, -0x103, -0xdf) + _0x2157d0(-0xaa, -0x7c, -0x63, -0x9d, '6%jx') + 'es'][_0x542213(0x28, 0x6c, 0x61, 'WABb', 0x4d) + _0x542213(0x2, -0x48, -0x16, 'cFgv', 0x3d) + 'xt'] && reactElement[_0x542213(0xd, 0x12, 0x3e, 'cFgv', 0x65) + 'n'][_0x2157d0(-0x125, -0xdd, -0xdd, -0x162, 'q@b9') + _0x542213(-0x25, 0x69, 0x25, 'MUbb', 0x72) + 'es'][_0x2695c4(0x23e, '^uCA', 0x20e, 0x223, 0x26a) + _0x87a1a6(-0x1aa, -0x10e, 'zKH5', -0x112, -0x15c) + 'xt'][_0x542213(-0xb, -0x15, -0x1b, '!n9x', -0x32) + 'xt']) { context = reactElement[_0x1fd140('cFgv', -0xcc, -0xb3, -0x5d, -0x8a) + 'n'][_0x87a1a6(-0x14a, -0x160, '6%jx', -0x11e, -0x13c) + _0x542213(0x20, 0x2f, 0x62, '$HS#', 0x5d) + 'es'][_0x2157d0(-0xb8, -0x9b, -0xb9, -0xe0, 'dtyC') + _0x1fd140('B0xc', -0x7f, -0x5f, -0xfe, -0xac) + 'xt'][_0x87a1a6(-0xd2, -0x104, '74pz', -0x13a, -0x113) + 'xt'][_0x2695c4(0x213, 'yN%X', 0x209, 0x21d, 0x225) + _0x2157d0(-0x103, -0xf3, -0x154, -0x116, '%4b^') + _0x1fd140('dyL%', -0x6c, -0x93, -0x1c, -0x58)]; break; } } if (context != null) { let formatting = _0x1fd140('vACQ', -0xab, -0x89, -0x34, -0x83) + _0x2695c4(0x1f1, 'g^gN', 0x228, 0x239, 0x275) + _0x87a1a6(-0xc8, -0x112, 'B0xc', -0xc2, -0xf1) + _0x2695c4(0x1d9, 'yCo)', 0x215, 0x1c6, 0x1fb) + _0x87a1a6(-0x14e, -0x16b, 'xC6X', -0x128, -0x13d) + _0x1fd140('74pz', -0x65, -0x8a, -0x49, -0x96) + '55'; console[_0x2157d0(-0xb9, -0xdb, -0xd3, -0x101, 'swo6')](_0x1fd140('$HS#', -0xd5, -0x8f, -0xd8, -0xc9) + _0x2157d0(-0x106, -0xfb, -0x149, -0xe1, '%4b^') + _0x1fd140('FpQS', -0x76, -0x5d, -0x61, -0x80) + '\x20', formatting), console[_0x1fd140('Se))', -0xbb, -0xad, -0x103, -0xaf)](_0x542213(0x4a, -0xa, 0xc, 'Se))', 0x41) + _0x2695c4(0x236, 'Se))', 0x230, 0x247, 0x298) + _0x1fd140('B2yC', -0x11a, -0xa3, -0xb1, -0xe1) + _0x2695c4(0x285, 'yCo)', 0x23d, 0x23b, 0x268) + _0x542213(0x2e, 0x47, -0xa, 'o[IN', 0x33) + _0x2695c4(0x23a, 'pDx6', 0x1b7, 0x1f4, 0x228) + _0x1fd140('zKH5', -0x6e, -0x74, -0x98, -0xb0) + _0x2695c4(0x198, '#]4r', 0x182, 0x1cf, 0x1be) + _0x2157d0(-0xb5, -0xd6, -0xa2, -0xc3, 'jOnY') + _0x2157d0(-0xcf, -0xee, -0xcb, -0x9b, 'FpQS') + ')\x20', formatting), console[_0x542213(-0x36, 0x2, -0x15, 'SxPd', -0x3d)](_0x2157d0(-0xe9, -0xbd, -0xea, -0xc6, '#]4r') + _0x542213(-0x5, -0x17, 0x12, '$*xr', 0x33) + _0x542213(-0x31, 0x55, 0x1, '4BgC', -0x3b) + _0x2695c4(0x236, '#]4r', 0x28b, 0x23f, 0x25c) + _0x2157d0(-0xc5, -0x8a, -0xa0, -0x9b, 'q@b9') + _0x2695c4(0x200, 'zKH5', 0x197, 0x1d7, 0x20f) + _0x542213(0x11, -0x5, 0x36, 'yCo)', 0x62) + _0x87a1a6(-0x12b, -0x111, 'o[IN', -0x15c, -0x12b) + _0x2157d0(-0xdd, -0xcf, -0xe2, -0xe5, 'WABb') + _0x1fd140('yCo)', -0x6d, -0x53, -0x6d, -0xa2) + _0x1fd140('$HS#', -0x33, -0xaa, -0x43, -0x72) + _0x542213(0x64, 0x8c, 0x66, '$HS#', 0x37) + _0x542213(0x19, 0x79, 0x42, 'y$f&', 0x39) + _0x2695c4(0x1f4, 'MUbb', 0x203, 0x1fb, 0x1df) + _0x542213(0x91, 0x59, 0x87, 'B2yC', 0x61) + _0x2157d0(-0xe2, -0xb3, -0x105, -0xb9, 'Hapz') + _0x2695c4(0x224, 'dtyC', 0x279, 0x244, 0x20f) + _0x1fd140('ndlK', -0xb9, -0x65, -0xa5, -0xa0) + _0x87a1a6(-0x185, -0x138, 'cFgv', -0x15a, -0x16b), formatting), console[_0x542213(0x3d, 0x52, 0x4d, 'swo6', 0x47)](_0x1fd140('Hapz', -0xef, -0xc9, -0xdb, -0xba) + _0x87a1a6(-0xf3, -0xe3, 'EdFi', -0xdd, -0x102) + _0x87a1a6(-0x10e, -0x144, 'Se))', -0x12f, -0x149) + _0x2695c4(0x285, '7s^0', 0x21c, 0x255, 0x2a5) + _0x1fd140('q@b9', -0x5f, -0x51, -0x70, -0x95), _0x1fd140('WABb', -0x5d, -0x40, 0x3, -0x4f) + _0x87a1a6(-0x19d, -0x162, 'sLcx', -0x17f, -0x160) + _0x542213(0x36, -0x12, 0x4, 'MUbb', 0x46) + _0x2157d0(-0x112, -0x159, -0x108, -0xea, '7s^0') + _0x2157d0(-0x10b, -0x11e, -0x11a, -0x11e, '$HS#') + _0x2695c4(0x222, 'sLcx', 0x271, 0x232, 0x232) + '22'), console[_0x1fd140('B6Q9', -0x67, -0xc5, -0xdf, -0xa6)](_0x2695c4(0x21f, 'B2yC', 0x25a, 0x22b, 0x1ef) + _0x2157d0(-0x10c, -0x15e, -0xec, -0xd0, 'pDx6') + _0x2695c4(0x250, '6%jx', 0x236, 0x24e, 0x23e) + _0x2157d0(-0xf1, -0xe2, -0xec, -0xa2, '0ZlO') + _0x542213(0x42, 0x81, 0x44, 'EdFi', 0x55) + _0x542213(0x67, 0x18, 0x39, 'xC6X', 0x22) + _0x87a1a6(-0x120, -0x160, 'y$f&', -0x14d, -0x157) + _0x2695c4(0x251, '#]4r', 0x1ea, 0x22f, 0x245) + _0x1fd140('gHR@', -0x8d, -0x12a, -0xbb, -0xda) + _0x87a1a6(-0xb0, -0xf8, '74pz', -0x98, -0xe7) + _0x2695c4(0x257, 'Se))', 0x245, 0x203, 0x1af) + _0x542213(0x71, 0x49, 0x55, 'Hapz', 0x6a), formatting), console[_0x2157d0(-0x92, -0x5e, -0x66, -0x8a, 'cFgv')](_0x87a1a6(-0xf3, -0x11d, '6%jx', -0xae, -0xf0) + _0x87a1a6(-0x111, -0x132, '6%jx', -0x101, -0xfb) + _0x2157d0(-0x124, -0x13a, -0x151, -0x10a, 'jOnY') + '\x20', formatting), window[_0x87a1a6(-0x135, -0x185, 'B0xc', -0x14a, -0x169) + _0x2695c4(0x22d, 'xC6X', 0x240, 0x261, 0x299) + _0x1fd140('B6Q9', -0x54, -0xc1, -0x9b, -0x89)] = context, window[_0x2157d0(-0x88, -0x94, -0x43, -0x50, 'cFgv') + _0x542213(-0x3c, 0x31, -0x7, 'gHR@', 0x4d) + 'e'] = window[_0x87a1a6(-0x186, -0x1be, 'B6Q9', -0x155, -0x183) + _0x2157d0(-0x95, -0xcb, -0x96, -0x61, 'swo6') + _0x542213(0xc, 0x5c, 0x9, 'g^gN', -0x2e)][_0x87a1a6(-0x136, -0xd4, 'FpQS', -0x159, -0x107) + _0x1fd140('e$mu', -0xea, -0x8e, -0x129, -0xd8)], window[_0x2695c4(0x241, 'ndlK', 0x1da, 0x1f1, 0x204)] = window[_0x2695c4(0x224, 'FpQS', 0x1b8, 0x1d2, 0x194) + _0x87a1a6(-0x11c, -0x16f, 'dtyC', -0x13d, -0x146) + 'e'][_0x2695c4(0x1b4, '$*xr', 0x1cc, 0x1c3, 0x1ed)]; } else throw new Error(_0x542213(-0x7, 0x2, 0xf, 'FpQS', -0x22) + _0x2695c4(0x227, 'xC6X', 0x1fa, 0x24d, 0x241) + _0x87a1a6(-0x115, -0x12e, '74pz', -0x114, -0x138) + _0x2695c4(0x18d, '7s^0', 0x1e0, 0x1c8, 0x1c8) + _0x2695c4(0x279, 'l6#p', 0x242, 0x24b, 0x243) + _0x542213(0x3d, 0x25, 0x78, 'xC6X', 0x2b) + _0x2695c4(0x1b7, '^uCA', 0x1b0, 0x1dd, 0x216) + _0x2157d0(-0xa9, -0x78, -0x5b, -0xc9, '0ZlO') + _0x2157d0(-0x80, -0xb7, -0x44, -0x56, 'WABb') + _0x542213(0x1f, -0x5, 0x2, 'vACQ', -0x31) + _0x542213(0xf, 0x4d, 0x46, '$HS#', 0x7d) + _0x2695c4(0x20f, '74pz', 0x1a3, 0x1c0, 0x1b4) + _0x2695c4(0x22e, 'FpQS', 0x1e1, 0x211, 0x218)); function _0x4402 () { const _0x220f85 = ['WQtdKCkf', 'fej3W7vo', 'vCoaWQddVX4', 'amooWRbEc8kKFJJdM8krWPXvWQe', 'dtPKWRhdIq', 'W7JdT2i8W5y', 'CSk+a8oEWQK', 'jI7dLCo5wa', 'rM/dLa', 'WOnRWQ1wwq', 'WOddNCkUwre', 'WRtdQsBcISkm', 'wSkwWR4', 'WP/cNCosW5iI', 'nh9kE1C', 'W7BdUgNdLCoi', 'WPqgm8kvWOu', 'W7ddOCkgeLy', 'hgSWW57cHq', 'W5ffASoUW4K', 'WQ8QW5RcIfi', 'fLv2W7S', 'W7ngW5pdLJOAW5K', 'W7faW7tdJ8kI', 'WRddHSoR', 'j8ocW7dcUfC', 'FmkbWQFdUrfWWR3dMeTIamkr', 'hghdKSo+tG', 'WQRcSSoQWOxcOq', 'xhtdLwhdMW', 'dxJcHWRcLW', 'Emo6WP7dSqS', 'W5TrW6HTeG', 'WRddHSoRAXC', 'W6mPW5CevW', 'BmkOe8od', 'WOddLmk4fWm', 'W4SgWQrolG', 'y8oLWP1IWOhdIHvDn8kV', 'WRm1W4jm', 'phZdLCo6xW', 'W6pcVSkT', 'WP01W4aSWPm', 'WP57WPNdOKK', 'ke97FvC', 'W41xmgJdQW', 'W6dcO8kUWPxcQW', 'emoQDa', 'W5ZdU8oIW5e3', 'WPpdTSkaWOpcGW', 'frvi', 'W67cUmkMWOhdQa', 'w2/cH1FdLG', 'WOH7WOtcRqa', 'tSkrW6dcPmkD', 'WO7dJ8kfWRX8', 'W73dLmo6DvS', 'W77dPgq3W4y', 'WQqhu0NcSa', 'FfzRWPbl', 'h8k5W4S9WQa', 'W5hdJmkKrqK', 'AZNcHCk9r00pvq4t', 'g8oMC8kPWOW', 'aevS', 'kCkQW47cPu8', 'xCo8zSoTWOm', 'ECoGWP9NW7u', 'y3ldLmo5WOa', 'W6VcTmk5', 't8kDWQpdQSkg', 'zCo5W5/dUWS', 'W4SoW6GjgCkLlf/cRIPTW7W', 'WQunauJcUq', 'WRlcSdDJWObiqmk2wmoJaG', 'WQrJWRPlWRG', 'zSk7d8kqWR0', 'W7hdVCo2W4aX', 'qmkAW7assq', 'fW5kaLO', 'W4BcSCo3W4tdSSkIebRcISkplKmf', 'p8kNWO4XWQS', 'WP0CW5L4hG', 'WPRcGmkaW4uZ', 'WQKDoCkEWRi', 'xM46W4BcGq', 'WRZdQs3dHCoc', 'WOnrAq', 'kSkYW5lcV1i', 'l8oFW7FcPve', 'nSkWW4a3WRe', 'nhtcGmkMW5G', 'W5ZdU8o3W4CX', 'qvlcRa', 'WOxdJmkgWP/cHq', 'WRHvFhJdOq', 'W5BdNCk3WOtcNW7cUW', 'W6tcN3mbDa', 'WQ9AW7FcQSkH', 'eSo7ACoUWPy', 'hCoXACo9WOC', 'r3BcJGa', 'W7pdVsBcJCoc', 'W4NdNSoaWO91W7RcI8o2W4Tljce', 'h8ktW5vOEG', 'o8ozW6dcRKC', 'W73dU8oVW5CG', 'gSkEW6dcUmoo', 'Ffz1WPzm', 'WP0cWRPeFG', 'WPKcWRDiEG', 'WOTBzsZcTq', 'z8o+WO/dGqS', 'W63dQNeHW4e', 'WRFdVIFcNmkl', 'WQ4lWRngAW', 'WO3dKCouWPJcNG', 'W74CpmkoWR4', 'WR7dTdVcMSoc', 'WQ/cHCkIW47dPq', 'WRamjG', 'WR3cTJTQWO0EwCkLq8oeiCoK', 'W4WcWOZcHmodW6mhnCkcW5BdPW', 'gmkyW4uXka', 'ob42W5Gi', 'W6GltH3dPa', 'BfP0WPTw', 'WRPJWRvpWRG', 'WRqSW4a', 'tf7cV8ozda', 'WQfOWRDaWRK', 'iGJcQ8kbW7S', 'xSkqW6m', 'qdfTWRpdIa', 'uqa2oWa', 'pva7W58p', 'WQShtWFdSq', 'W6JdRg89W4C', 'W7D3WOGtqSklW5ScW645', 'WPhcImkcW78P', 'iYBcLmk1W4ivWQpcJmkgjCkGqge', 'W5eei3dcHs9TW49Qqq', 'BCkGW5SkwG', 'p8o7w8kaW7XlWPldNmktz8ouwa', 'c8oZr8oUWO8', 'WQKlvtddVW', 'rxRdL0FdMW', 'gSo7D8oSWOW', 'WRnSWO/cRWO', 't08xqHzxW5BdLvP3zmku', 'W67dSsn/WOS', 'FMxcGmoMWOC', 'e8o3B8oOWOG', 'pSkWW541WQS', 'WRtdKYXyEq', 'WQ4HW4e', 'jIvWceS', 'WPK/abVdPW', 'cmodWQ/cQCkb', 'EJFdMCoJWOC', 'qIWLWRtdJq', 'WRODjCkyWRm', 'CCkqW6OtxG', 'WQrPWRm', 'BJ7cJmkYeGTSwX8oWPhcOfa', 'fW5C', 'WPblWRbusq', 'W4GCFZddOq']; _0x4402 = function () { return _0x220f85; }; return _0x4402(); } window[_0x2157d0(-0x8b, -0x3e, -0xd6, -0xb0, '^uCA') + _0x2157d0(-0x111, -0xff, -0x164, -0x15f, 'WABb') + 'e'] = window[_0x87a1a6(-0xf6, -0x122, 'Hapz', -0xa4, -0xe5)];
        }
    }

    let api = new E2API();

    class JewelSlotter {
        constructor(api) {
            this.api = api;
            this.unslutAll = toUnslutCodes.length === 1 && toUnslutCodes[0] === "*";
            console.log("unslut all: "+this.unslutAll);
        }

        async init () {
            this.mentars = await api.getAllMentars();
            console.log("init finished");
        }

        async unSlutAllMentars () {
            //console.log("mentars: ", this.mentars);

            let mentarsToUnslot = this.unslutAll ?
                this.mentars.filter(m => m.attributes.jewels.data.length > 0)
                : this.mentars.filter(m => m.attributes.jewels.data.some(mj => toUnslutCodes.includes(mj.attributes.uid)));

            console.log(`mentars to unslut: ${mentarsToUnslot.length} (total: ${this.mentars.length})`);

            for (let i = 0; i < mentarsToUnslot.length; i++) {
                let mentar = mentarsToUnslot[i];

                let msgPrefix = `[${i + 1}/${mentarsToUnslot.length}] (${mentar.attributes.description})`

                let slottedJewelCount = mentar.attributes.jewels.data.length;

                let jewelsToUnslot = this.unslutAll ?
                    mentar.attributes.jewels.data
                    : mentar.attributes.jewels.data.filter(mj => toUnslutCodes.includes(mj.attributes.uid));

                //await helper.sleep(helper.getWaitTime(i + 1, 2047));
                await helper.sleep(helper.getWaitTime(i + 1, 128));
                console.log(`unslutting: ${msgPrefix} >> slutted jewels: ${jewelsToUnslot.length} (total: ${slottedJewelCount})`);

                for (let j = 0; j < jewelsToUnslot.length; j++) {
                    let jewel = jewelsToUnslot[j];
                    await this.unSlotJewel(jewel.id);
                }
            }
        }

        async unSlotJewel (jewelId) {
            //console.log("unslut ", jewelId);
            await ___reactContext.api.updateJewel({
                id: jewelId,
                slotted_into_landfield_id: null
            })
        }
    }

    window.jewelSlotter = new JewelSlotter(api);
    await window.jewelSlotter.init();
    await window.jewelSlotter.unSlutAllMentars();
    console.log("unslutting finished");

})();
