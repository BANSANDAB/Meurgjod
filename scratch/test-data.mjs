async function test() {
  const url = 'https://docs.google.com/spreadsheets/d/10nzaDw3TWBgFp12jHwMfjY4ajFaLaU0k6PDWO8RpMcE/gviz/tq?tqx=out:csv&gid=0';
  const res = await fetch(url);
  const text = await res.text();
  const lines = text.trim().split('\n');
  console.log('Total lines:', lines.length);

  function parseCSV(text) {
    const lines = text.trim().split(/\r?\n/);
    const result = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const row = [];
      let inQuotes = false;
      let current = '';
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"' && (j === 0 || line[j-1] !== '\\')) {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          row.push(current);
          current = '';
        } else {
          current += char;
        }
      }
      row.push(current);
      result.push(row);
    }
    return result;
  }

  const rows = parseCSV(text);
  const dataRows = rows.slice(1);
  let coupleInc = 0;
  let coupleExp = 0;
  let coupleCount = 0;
  let latestCoupleTxs = [];

  for (const row of dataRows) {
    if (row.length < 5) continue;
    const [id, dateStr, account, type, category, desc, amountStr] = row;
    const amount = parseFloat(amountStr) || 0;
    if (account === 'น้ำหนัก' || category === 'น้ำหนักรายวัน') continue;
    const isIncome = type === 'รายรับ' || type === 'income';
    const isExpense = type === 'รายจ่าย' || type === 'expense';
    if (!isIncome && !isExpense) continue;

    const acc = (account || '').trim().toLowerCase();
    const isCouple = !(acc.includes('personal') || acc.includes('ส่วนตัว') || acc.includes('รายจ่ายโจ') || (acc.includes('รายจ่าย') && acc.includes('จ')));
    if (isCouple) {
      coupleCount++;
      if (isIncome) coupleInc += amount;
      if (isExpense) coupleExp += amount;
      latestCoupleTxs.push({ id, dateStr, account, type, category, desc, amount });
    }
  }

  console.log('Couple transactions:', coupleCount);
  console.log('Couple Total Income:', coupleInc);
  console.log('Couple Total Expense:', coupleExp);
  console.log('Couple Total Net Balance:', coupleInc - coupleExp);
  console.log('Latest 5 items (from bottom):');
  latestCoupleTxs.slice(-5).reverse().forEach(t => {
    console.log(`- [${t.dateStr}] ${t.type} ${t.category}: ${t.amount} บาท (${t.desc})`);
  });
}

test().catch(console.error);
