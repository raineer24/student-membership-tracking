const addMonths = (date, months) => {
    const newDate = new Date(date);
    newDate.setMonth(newDate.getMonth() + months);
    return newDate;
};

exports.calculateDueDate = (startDate, type) => {
    if (type === 'MONTHLY') return addMonths(startDate, 1);
    else if (type === 'YEARLY') return addMonths(startDate, 12);
    return null;
};

exports.checkPaymentStatus = (dueDate) => {
    const now = new Date();
    const gracePeriodDays = 5;
    const overdueDate = new Date(dueDate);
    overdueDate.setDate(overdueDate.getDate() + gracePeriodDays);

    if (now > overdueDate) return 'OVERDUE';
    else if (now >= dueDate) return 'DUE';
    return 'PAID';
}