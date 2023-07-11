
export function calculateWeightedRandom(weights: number[]){

    let index_list = new Array<number>();

    //We put each index in new array as many times as number under that index told us
    //As a result - the index with bigger number will be picked more often, which is a purpose of this whole function

    for(let i = 0; i < weights.length; i++) {
        for(let j = 0; j < weights[i]; j++){
            index_list.push(i)
        }
    }

    let random_result = index_list[Math.floor(Math.random() * index_list.length)];

    return random_result
}
