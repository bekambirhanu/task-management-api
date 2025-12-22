class KeyGenerator {

    static generateRandomString = () => {
        const characters = 'Ma008w2Yv@#u23851CL8$%#f6Gs^*47%$^0Sj%$7EX*(^1PN9IFhB*(%cKyDzUg5qZ^#@#%R4opmlt)_+*^V3idJx9OT*^%#kAnQ4*^35H92617rWeb6';
        let result = '';
        const charactersLength = characters.length;
        for (let i = 0; i < 8; i++) {
          result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }

}

module.exports = KeyGenerator;