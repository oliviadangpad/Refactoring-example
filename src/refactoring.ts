import { IInvoice, IPerformance, IPlays } from "./type-helper";

export function statement(invoice: IInvoice, plays: IPlays) {
  const statementData: any = {};
  statementData.customer = invoice.customer;
  statementData.performances = invoice.performances.map(enrichPerformance);
  statementData.totalAmount = totalAmount(statementData);
  statementData.totalVolumeCredits = totalVolumeCredits(statementData);
  console.log(statementData.performances);
  return renderPlainText(statementData, invoice, plays);

  function totalAmount(data) {
    return data.performances.reduce((acc, perf) => acc + perf.amount, 0);
  }

  function totalVolumeCredits(data) {
    return data.performances.reduce((acc, perf) => acc + perf.volumeCredits, 0);
  }

  function enrichPerformance(aPerformance: IPerformance) {
    // shallow copy object => immutable origin
    const result: any = Object.assign({}, aPerformance);
    result.play = playFor(result);
    result.amount = amountFor(result);
    result.volumeCredits = volumeCreditsFor(result);
    return result;
  }

  function volumeCreditsFor(aPerformance: any) {
    let result = 0;
    // add volume credits
    result += Math.max(aPerformance.audience - 30, 0);
    // add extra credit for every ten comedy attendees
    if ("comedy" === aPerformance.play.type)
      result += Math.floor(aPerformance.audience / 5);
    return result;
  }

  function playFor(perf: IPerformance) {
    return plays[perf.playID];
  }

  function amountFor(aPerformance: any) {
    let result = 0;
    switch (playFor(aPerformance).type) {
      case "tragedy":
        result = 40000;
        if (aPerformance.audience > 30) {
          result += 1000 * (aPerformance.audience - 30);
        }
        break;
      case "comedy":
        result = 30000;
        if (aPerformance.audience > 20) {
          result += 10000 + 500 * (aPerformance.audience - 20);
        }
        result += 300 * aPerformance.audience;
        break;
      default:
        throw new Error(`unknown type: ${playFor(aPerformance).type}`);
    }
    return result;
  }
}

function renderPlainText(data: any, invoice: IInvoice, plays: IPlays) {
  let result = `Statement for ${data.customer}\n`;

  for (let perf of data.performances) {
    // print line for this order
    result += ` ${perf.play.name}: ${toUsd(perf.amount)} (${
      perf.audience
    } seats)\n`;
  }

  result += `Amount owed is ${toUsd(data.totalAmount)}\n`;
  result += `You earned ${data.totalVolumeCredits} credits\n`;
  return result;

  function toUsd(aNumber: number) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(aNumber / 100);
  }
}
