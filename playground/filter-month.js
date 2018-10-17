// let dates = [
//     new Date(2018, 9, 1),
//     new Date(2018, 9, 2),
//     new Date(2018, 10, 1),
//     new Date(2018, 11, 1),
// ];

// let currentMonth = new Date().getMonth();

// let filtered = dates.filter(date => date.getMonth() === currentMonth);

// console.log(filtered);
var date = new Date();
var firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
var lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);

console.log(firstDay, lastDay);
