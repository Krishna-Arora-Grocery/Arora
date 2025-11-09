interface CommissionCalculation {
  oldIdSuccessAmount: number
  newIdSuccessAmount: number
  oldIdCancelledAmount: number
  newIdCancelledAmount: number
  totalCommission: number
}

interface CommissionRates {
  oldIdSuccessCommission: number
  newIdSuccessCommission: number
  oldIdCancelledCommission: number
  newIdCancelledCommission: number
}

interface OrderData {
  totalOldIdOrders: number
  totalNewIdOrders: number
  totalOldIdCancelled: number
  totalNewIdCancelled: number
}

export function calculateCommission(orderData: OrderData, rates: CommissionRates): CommissionCalculation {
  // Calculate successful orders (placed - cancelled)
  const oldIdSuccessful = orderData.totalOldIdOrders - orderData.totalOldIdCancelled
  const newIdSuccessful = orderData.totalNewIdOrders - orderData.totalNewIdCancelled

  // Calculate commission amounts
  const oldIdSuccessAmount = oldIdSuccessful * rates.oldIdSuccessCommission
  const newIdSuccessAmount = newIdSuccessful * rates.newIdSuccessCommission
  const oldIdCancelledAmount = orderData.totalOldIdCancelled * rates.oldIdCancelledCommission
  const newIdCancelledAmount = orderData.totalNewIdCancelled * rates.newIdCancelledCommission

  // Calculate total commission
  const totalCommission = oldIdSuccessAmount + newIdSuccessAmount + oldIdCancelledAmount + newIdCancelledAmount

  return {
    oldIdSuccessAmount,
    newIdSuccessAmount,
    oldIdCancelledAmount,
    newIdCancelledAmount,
    totalCommission,
  }
}
