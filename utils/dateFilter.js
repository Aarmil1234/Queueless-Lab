function getDateRangeFromFilter(filter) {
    if (!filter) return null;

    const now = new Date();
    let start, end;

    switch (filter) {
        case 'today': {
            start = new Date(now);
            start.setHours(0, 0, 0, 0);
            end = new Date(now);
            end.setHours(23, 59, 59, 999);
            break;
        }
        case 'yesterday': {
            const yesterday = new Date(now);
            yesterday.setDate(now.getDate() - 1);
            start = new Date(yesterday);
            start.setHours(0, 0, 0, 0);
            end = new Date(yesterday);
            end.setHours(23, 59, 59, 999);
            break;
        }
        case 'thisWeek': {
            const dayIndex = now.getDay();
            const diffToMonday = dayIndex === 0 ? -6 : 1 - dayIndex;
            start = new Date(now);
            start.setDate(now.getDate() + diffToMonday);
            start.setHours(0, 0, 0, 0);
            end = new Date(now);
            end.setHours(23, 59, 59, 999);
            break;
        }
        case 'thisMonth': {
            start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
            end = new Date(now);
            end.setHours(23, 59, 59, 999);
            break;
        }
        case 'lastMonth': {
            start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
            end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
            break;
        }
        default:
            return null;
    }

    return { start, end };
}

module.exports = { getDateRangeFromFilter };
