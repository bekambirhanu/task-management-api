exports.timeDifference = (date) => {
    const current_time = Date.now();
    
    const diff = current_time - date;

    const hour = Math.floor(diff / (1000* 60 * 60))

    return hour;
}