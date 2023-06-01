
const PRIME_TABLE = [-5, -4, -3, -2, -2, -1, -1, -1, 0, 0, 0, 0, 1, 1, 1, 2, 2, 3, 4, 5];
export default class PrimeDie extends DiceTerm
{
    constructor(termData)
    {
        super(termData);
        this.faces = 20;
    }

    _roll()
    {
        const rand = CONFIG.Dice.randomUniform();
        const result = Math.ceil(rand * this.faces);
        const primeModifier = PRIME_TABLE[result-1];
        const roll = {result, primeModifier, active: true};
        this.results.push(roll);
        return roll;
    }

    /** @override */
    get total()
    {
        if ( !this._evaluated ) return null;
        return this.results.reduce((t, r) =>
        {
            if ( !r.active ) return t;
            else return t + r.primeModifier;
        }, 0);
    }

    /** @override */
    roll()
    {
        let roll = this._roll();
        let checked = 0;
        while ( checked < this.results.length )
        {
            let r = this.results[checked];
            checked++;
            if (!r.active) continue;

            // Determine whether to explode the result and roll again!
            if ( r.result === 1 || r.result === 20)
            {
                r.exploded = true;
                roll = this._roll();
            }
            if ( checked > 1000 ) throw new Error("Maximum recursion depth for prime dice roll exceeded");
        }
        return roll;
    }
}
/** @override */
PrimeDie.DENOMINATION = "p";
CONFIG.Dice.terms["p"] = PrimeDie;
