export function getCurrentDayUTC() {
    const oneDayBefore = new Date
    oneDayBefore.setUTCHours(0, 0, 0, 0)
    return oneDayBefore
}



export let oneWeekBefore = new Date
oneWeekBefore.setUTCHours(0, 0, 0, 0)
function getMonday(d: Date) {
    d = new Date(d);
    let day = d.getDay()
    let diff = d.getDate() - day + (day == 0 ? -6 : 1) // adjust when day is sunday
    return new Date(d.setDate(diff))
}
oneWeekBefore = getMonday(new Date())
oneWeekBefore.setUTCHours(0, 0, 0, 0)

export const monthBefore = () => {
    let oneMonthBefore: Date = new Date
    oneMonthBefore.setUTCHours(0, 0, 0, 0)
    oneMonthBefore.setUTCMonth(oneMonthBefore.getMonth(), 1)
    return oneMonthBefore
}