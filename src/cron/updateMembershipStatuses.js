// const prisma = require("../config/db");
// const {
//   checkPaymentStatus,
//   calculateDueDate,
// } = require("../utils/membershipUtils");

// const updateMembershipStatuses = async () => {
//   try {
//     const memberships = await prisma.membership.findMany();
//     for (const membership of memberships) {
//       const dueDate = calculateDueDate(membership.startDate, membership.type);
//       const status = checkPaymentStatus(dueDate);
//       if (status !== membership.paymentStatus) {
//         await prisma.membership.update({
//           where: { id: membership.id },
//           data: { paymentStatus: status },
//         });
//         console.log(
//           `Updated membership ID ${membership.id} to status: ${status}`
//         );
//       }
//     }
//   } catch (error) {
//     console.error("Error updating membership statuses:", error);
//   }
// };

// module.exports = updateMembershipStatuses;
