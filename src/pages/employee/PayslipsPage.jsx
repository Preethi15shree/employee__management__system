import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { FileText, Download, X, Printer } from 'lucide-react';

// ── Number to words ──────────────────────────────────────────────────────────
function numberToWords(num) {
  if (!num || num === 0) return 'Zero Only';
  const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  function helper(n) {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n/10)] + (n%10 ? ' '+ones[n%10] : '');
    if (n < 1000) return ones[Math.floor(n/100)]+' Hundred'+(n%100 ? ' '+helper(n%100) : '');
    if (n < 100000) return helper(Math.floor(n/1000))+' Thousand'+(n%1000 ? ' '+helper(n%1000) : '');
    return helper(Math.floor(n/100000))+' Lakh'+(n%100000 ? ' '+helper(n%100000) : '');
  }
  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);
  let result = helper(rupees) + ' Rupees';
  if (paise > 0) result += ' and ' + helper(paise) + ' Paise';
  return result + ' Only';
}

// ── PDF / Print helper ───────────────────────────────────────────────────────
function printPayslip(ps) {
  const fmt = n => '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
  const row = (label, value, cls='') =>
    `<tr><td style="padding:6px 12px;color:#555;font-size:13px">${label}</td><td style="padding:6px 12px;text-align:right;font-size:13px;font-weight:600;${cls}">${value}</td></tr>`;

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Payslip - ${ps.month} ${ps.year}</title>
  <style>body{font-family:Arial,sans-serif;margin:0;padding:20px;color:#1a1a2e}table{width:100%;border-collapse:collapse}
  @media print{.no-print{display:none}}</style></head><body>
  <div class="no-print" style="text-align:right;margin-bottom:16px">
    <button onclick="window.print()" style="background:#4f46e5;color:white;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;font-size:14px;margin-right:8px">🖨 Print / Save PDF</button>
    <button onclick="window.close()" style="background:#e5e7eb;color:#374151;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;font-size:14px">✕ Close</button>
  </div>
  <div style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;max-width:800px;margin:0 auto">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:24px 32px;color:white;display:flex;justify-content:space-between;align-items:flex-start">
      <div>
        <div style="font-size:22px;font-weight:800;margin-bottom:4px">${ps.companyName || 'Company Name'}</div>
        <div style="font-size:12px;opacity:.85">${ps.companyAddress || ''}</div>
      </div>
      <div style="text-align:right">
        <div style="font-size:18px;font-weight:700;letter-spacing:2px">PAYSLIP</div>
        <div style="font-size:13px;margin-top:4px;opacity:.9">${ps.payPeriod || ps.month + ' ' + ps.year}</div>
        <div style="margin-top:6px;background:rgba(255,255,255,.2);padding:3px 10px;border-radius:20px;font-size:11px;display:inline-block">${ps.status || 'Generated'}</div>
      </div>
    </div>

    <!-- Employee & Pay Period Details -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0;border-bottom:1px solid #e2e8f0">
      <div style="padding:20px 24px;border-right:1px solid #e2e8f0">
        <div style="font-size:11px;font-weight:700;color:#6366f1;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px">Employee Details</div>
        <table><tbody>
          ${[['Name', ps.employeeName],['Employee ID', ps.employeeId || '—'],['Department', ps.department],['Designation', ps.designation],['PAN', ps.pan || '—'],['UAN', ps.uan || '—']].map(([l,v])=>`<tr><td style="padding:4px 0;font-size:13px;color:#666;width:120px">${l}</td><td style="padding:4px 0;font-size:13px;font-weight:600">${v||'—'}</td></tr>`).join('')}
        </tbody></table>
      </div>
      <div style="padding:20px 24px">
        <div style="font-size:11px;font-weight:700;color:#6366f1;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px">Pay Period Details</div>
        <table><tbody>
          ${[['Month / Year', (ps.month||'')+ ' ' +(ps.year||'')],['Pay Period', ps.payPeriod||'—'],['Work Days', (ps.workDays||'—')+' days'],['Generated On', ps.generatedOn||'—'],['Bank Name', ps.bankName||'—'],['Bank Account', ps.bankAccount||'—']].map(([l,v])=>`<tr><td style="padding:4px 0;font-size:13px;color:#666;width:120px">${l}</td><td style="padding:4px 0;font-size:13px;font-weight:600">${v}</td></tr>`).join('')}
        </tbody></table>
      </div>
    </div>

    <!-- Earnings & Deductions -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0;border-bottom:1px solid #e2e8f0">
      <div style="border-right:1px solid #e2e8f0">
        <div style="background:#f0fdf4;padding:10px 12px;font-size:12px;font-weight:700;color:#15803d;text-transform:uppercase;letter-spacing:1px">Earnings (Inflow)</div>
        <table><tbody>
          ${[['Basic Salary', fmt(ps.basicSalary),'color:#15803d'],['House Rent Allowance (HRA)', fmt(ps.hra),'color:#15803d'],['Special / Conveyance Allowance', fmt(ps.specialAllowance),'color:#15803d'],['Bonus / Incentives', fmt(ps.bonus),'color:#15803d'],['Overtime Pay', fmt(ps.overtimePay),'color:#15803d']].map(([l,v,c])=>row(l,v,c)).join('')}
        </tbody><tfoot>
          <tr style="background:#f0fdf4"><td style="padding:8px 12px;font-weight:700;font-size:13px">Gross Earnings</td><td style="padding:8px 12px;text-align:right;font-weight:800;font-size:14px;color:#15803d">${fmt(ps.grossEarnings)}</td></tr>
        </tfoot></table>
      </div>
      <div>
        <div style="background:#fef2f2;padding:10px 12px;font-size:12px;font-weight:700;color:#dc2626;text-transform:uppercase;letter-spacing:1px">Deductions (Outflow)</div>
        <table><tbody>
          ${[['Income Tax / TDS', '-'+fmt(ps.incomeTax),'color:#dc2626'],['Provident Fund (PF)', '-'+fmt(ps.pf),'color:#dc2626'],['Professional Tax', '-'+fmt(ps.professionalTax),'color:#dc2626'],['Health / Life Insurance', '-'+fmt(ps.healthInsurance),'color:#dc2626'],['Other Deductions', '-'+fmt(ps.otherDeductions),'color:#dc2626']].map(([l,v,c])=>row(l,v,c)).join('')}
        </tbody><tfoot>
          <tr style="background:#fef2f2"><td style="padding:8px 12px;font-weight:700;font-size:13px">Total Deductions</td><td style="padding:8px 12px;text-align:right;font-weight:800;font-size:14px;color:#dc2626">-${fmt(ps.totalDeductions)}</td></tr>
        </tfoot></table>
      </div>
    </div>

    <!-- Net Pay -->
    <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:24px 32px;color:white">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <div>
          <div style="font-size:13px;opacity:.8;margin-bottom:4px">NET PAY (TAKE HOME)</div>
          <div style="font-size:32px;font-weight:800">${fmt(ps.netPay)}</div>
        </div>
        <div style="text-align:right;font-size:12px;opacity:.8">
          <div>Gross: ${fmt(ps.grossEarnings)}</div>
          <div>Deductions: -${fmt(ps.totalDeductions)}</div>
        </div>
      </div>
      <div style="background:rgba(255,255,255,.15);border-radius:8px;padding:12px 16px">
        <div style="font-size:11px;opacity:.8;margin-bottom:4px">AMOUNT IN WORDS:</div>
        <div style="font-size:14px;font-weight:600">${numberToWords(ps.netPay)}</div>
      </div>
    </div>

    <div style="padding:16px 32px;font-size:11px;color:#9ca3af;text-align:center;border-top:1px solid #f3f4f6">
      This is a computer-generated payslip and does not require a physical signature. · ${ps.companyName || 'Company'} · Confidential
    </div>
  </div>
  </body></html>`;

  const win = window.open('', '_blank', 'width=900,height=700');
  win.document.write(html);
  win.document.close();
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function PayslipsPage() {
  const { user } = useAuth();
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const eid = String(user?.employeeId || user?.id || '');

  useEffect(() => {
    if (!eid) return;
    api.get('/payslips')
      .then(r => {
        // Filter client-side to avoid json-server v1 type mismatch
        const mine = r.data.filter(p => String(p.employeeId) === eid);
        setPayslips(mine.sort((a, b) => b.year - a.year || b.month.localeCompare(a.month)));
      })
      .catch(() => toast.error('Failed to load payslips'))
      .finally(() => setLoading(false));
  }, [eid]);

  const fmt = n => '₹' + Number(n || 0).toLocaleString('en-IN');

  if (loading) return <div className="text-center text-gray-500 py-20">Loading payslips…</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">My Payslips</h1>
      <p className="text-sm text-gray-500 mb-6">Click any payslip to view full details and download as PDF</p>

      {payslips.length === 0 ? (
        <div className="text-center text-gray-400 py-20 bg-white rounded-xl shadow-sm">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium text-gray-600">No payslips available yet</p>
          <p className="text-sm mt-1">Payslips are generated by HR at end of each pay period</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {payslips.map(ps => (
            <div key={ps.id} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-indigo-200 transition cursor-pointer group" onClick={() => setSelected(ps)}>
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-t-xl px-5 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-bold text-lg">{ps.month} {ps.year}</p>
                    <p className="text-indigo-200 text-xs mt-0.5">{ps.payPeriod}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${ps.status === 'Paid' ? 'bg-green-400/30 text-green-100' : 'bg-yellow-400/30 text-yellow-100'}`}>{ps.status}</span>
                </div>
              </div>
              <div className="px-5 py-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Gross Earnings</span>
                  <span className="font-semibold text-green-600">{fmt(ps.grossEarnings)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total Deductions</span>
                  <span className="font-semibold text-red-500">-{fmt(ps.totalDeductions)}</span>
                </div>
                <div className="h-px bg-gray-100 my-2" />
                <div className="flex justify-between">
                  <span className="text-sm font-bold text-gray-700">Net Pay</span>
                  <span className="font-bold text-indigo-600 text-lg">{fmt(ps.netPay)}</span>
                </div>
                <div className="pt-2">
                  <p className="text-xs text-gray-400">Work Days: {ps.workDays} · Generated: {ps.generatedOn}</p>
                </div>
              </div>
              <div className="px-5 pb-4">
                <button onClick={(e) => { e.stopPropagation(); printPayslip(ps); }} className="w-full flex items-center justify-center gap-2 border border-indigo-200 text-indigo-600 hover:bg-indigo-50 py-2 rounded-lg text-sm font-medium transition group-hover:border-indigo-400">
                  <Download className="w-4 h-4" /> Download PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Full Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-bold text-gray-900">Payslip — {selected.month} {selected.year}</h2>
              <div className="flex gap-2">
                <button onClick={() => printPayslip(selected)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                  <Download className="w-4 h-4" /> Download / Print PDF
                </button>
                <button onClick={() => setSelected(null)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Company header */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-xl p-6 mb-5 text-white flex items-start justify-between">
                <div>
                  <p className="text-xl font-bold">{selected.companyName}</p>
                  <p className="text-indigo-200 text-sm mt-0.5">{selected.companyAddress}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg tracking-widest">PAYSLIP</p>
                  <p className="text-indigo-200 text-sm">{selected.payPeriod}</p>
                  <span className="mt-2 inline-block bg-white/20 text-white text-xs px-2.5 py-0.5 rounded-full">{selected.status}</span>
                </div>
              </div>

              {/* Employee + Pay Period */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-bold text-indigo-600 uppercase tracking-wide mb-3">Employee Details</p>
                  <table className="w-full text-sm">
                    <tbody>
                      {[['Name', selected.employeeName], ['Employee ID', selected.employeeId || '—'], ['Department', selected.department], ['Designation', selected.designation], ['PAN', selected.pan || '—'], ['UAN', selected.uan || '—']].map(([l,v]) => (
                        <tr key={l}><td className="py-1 text-gray-500 pr-4 w-28">{l}</td><td className="py-1 font-semibold text-gray-800">{v}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-bold text-indigo-600 uppercase tracking-wide mb-3">Pay Period & Bank Details</p>
                  <table className="w-full text-sm">
                    <tbody>
                      {[['Month', selected.month + ' ' + selected.year], ['Pay Period', selected.payPeriod], ['Work Days', selected.workDays + ' days'], ['Generated On', selected.generatedOn], ['Bank', selected.bankName || '—'], ['Account No.', selected.bankAccount || '—']].map(([l,v]) => (
                        <tr key={l}><td className="py-1 text-gray-500 pr-4 w-28">{l}</td><td className="py-1 font-semibold text-gray-800">{v}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Earnings & Deductions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                {/* Earnings */}
                <div className="border border-green-200 rounded-xl overflow-hidden">
                  <div className="bg-green-50 px-4 py-2.5 border-b border-green-200">
                    <p className="text-sm font-bold text-green-700">Earnings (Inflow)</p>
                  </div>
                  <table className="w-full">
                    <tbody className="divide-y divide-gray-50">
                      {[
                        ['Basic Salary', selected.basicSalary],
                        ['HRA', selected.hra],
                        ['Special / Conveyance Allowance', selected.specialAllowance],
                        ['Bonus / Incentives', selected.bonus],
                        ['Overtime Pay', selected.overtimePay],
                      ].map(([label, value]) => (
                        <tr key={label}>
                          <td className="px-4 py-2 text-sm text-gray-600">{label}</td>
                          <td className="px-4 py-2 text-sm font-semibold text-green-700 text-right">₹{Number(value||0).toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-green-50 border-t border-green-200">
                        <td className="px-4 py-2.5 text-sm font-bold text-gray-800">Gross Earnings</td>
                        <td className="px-4 py-2.5 text-sm font-bold text-green-700 text-right">₹{Number(selected.grossEarnings||0).toLocaleString('en-IN')}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Deductions */}
                <div className="border border-red-200 rounded-xl overflow-hidden">
                  <div className="bg-red-50 px-4 py-2.5 border-b border-red-200">
                    <p className="text-sm font-bold text-red-700">Deductions (Outflow)</p>
                  </div>
                  <table className="w-full">
                    <tbody className="divide-y divide-gray-50">
                      {[
                        ['Income Tax / TDS', selected.incomeTax],
                        ['Provident Fund (PF)', selected.pf],
                        ['Professional Tax', selected.professionalTax],
                        ['Health / Life Insurance', selected.healthInsurance],
                        ['Other Deductions', selected.otherDeductions],
                      ].map(([label, value]) => (
                        <tr key={label}>
                          <td className="px-4 py-2 text-sm text-gray-600">{label}</td>
                          <td className="px-4 py-2 text-sm font-semibold text-red-600 text-right">-₹{Number(value||0).toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-red-50 border-t border-red-200">
                        <td className="px-4 py-2.5 text-sm font-bold text-gray-800">Total Deductions</td>
                        <td className="px-4 py-2.5 text-sm font-bold text-red-600 text-right">-₹{Number(selected.totalDeductions||0).toLocaleString('en-IN')}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Net Pay Banner */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-xl p-5 text-white">
                <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
                  <div>
                    <p className="text-indigo-200 text-sm mb-1">NET PAY (Take Home)</p>
                    <p className="text-3xl font-extrabold tracking-tight">₹{Number(selected.netPay||0).toLocaleString('en-IN')}</p>
                  </div>
                  <div className="text-right text-sm text-indigo-200">
                    <p>Gross: ₹{Number(selected.grossEarnings||0).toLocaleString('en-IN')}</p>
                    <p>Deductions: -₹{Number(selected.totalDeductions||0).toLocaleString('en-IN')}</p>
                  </div>
                </div>
                <div className="bg-white/15 rounded-lg px-4 py-3">
                  <p className="text-xs text-indigo-200 mb-1">AMOUNT IN WORDS</p>
                  <p className="text-sm font-semibold leading-relaxed">{numberToWords(selected.netPay)}</p>
                </div>
              </div>

              <p className="text-xs text-gray-400 text-center mt-4">Computer-generated payslip · Use <strong>Download / Print PDF</strong> to export</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
