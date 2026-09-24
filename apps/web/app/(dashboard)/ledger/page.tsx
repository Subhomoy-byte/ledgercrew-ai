"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

type Invoice = {
  id: string;
  client: string;
  amount: string;
  status: "Overdue" | "Due Fri" | "Due 24 Sep" | "Paid";
  age: string;
};

const INVOICES: Invoice[] = [
  { id: "INV-0412", client: "Sharma Textiles", amount: "₹42,000", status: "Overdue", age: "12 days" },
  { id: "INV-0417", client: "Bose Digital Studio", amount: "₹28,500", status: "Overdue", age: "6 days" },
  { id: "INV-0421", client: "Anjali Freelance Co.", amount: "₹15,000", status: "Due Fri", age: "—" },
  { id: "INV-0409", client: "Ghosh & Sons Traders", amount: "₹67,200", status: "Paid", age: "—" },
  { id: "INV-0424", client: "Ray Consulting", amount: "₹31,500", status: "Due 24 Sep", age: "—" },
  { id: "INV-0430", client: "Nandi Hardware", amount: "₹9,800", status: "Paid", age: "—" },
];

const STATUS_CLASS: Record<Invoice["status"], string> = {
  Overdue: "bg-[#F3DED9] text-[#A63A2C]",
  "Due Fri": "bg-[#F1E0BE] text-[#8A5B14]",
  "Due 24 Sep": "bg-[#F1E0BE] text-[#8A5B14]",
  Paid: "bg-[#DCEAE3] text-[#2F6B57]",
};

export default function LedgerPage() {
  const rowsRef = useRef<(HTMLTableRowElement | null)[]>([]);

  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const rows = rowsRef.current.filter(Boolean);
    if (rows.length) {
      gsap.fromTo(
        rows,
        { opacity: 0, x: -12 },
        {
          opacity: 1,
          x: 0,
          duration: reduceMotion ? 0 : 0.45,
          stagger: reduceMotion ? 0 : 0.05,
          ease: "power3.out",
        }
      );
    }
  }, []);

  return (
    <>
      <h1 className="font-serif text-[26px] font-medium">Ledger</h1>
      <p className="mb-7 text-sm text-ink-soft">Every invoice, in one place.</p>

      <div className="overflow-hidden rounded-[16px] border border-line shadow-sm">
        <table className="w-full border-collapse bg-[#FFFDF6] text-[#1D1B14]">
          <thead>
            <tr>
              {["Invoice", "Client", "Amount", "Status", "Age"].map((h) => (
                <th
                  key={h}
                  className="border-b border-[#E4DBBF] px-[22px] py-3 pb-[10px] text-left text-xs font-medium text-[#8A8168]"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {INVOICES.map((inv, i) => (
              <tr
                key={inv.id}
                ref={(el) => { rowsRef.current[i] = el; }}
                className="border-b border-[#EFE9D3] transition-colors last:border-b-0 hover:bg-[#FBF6E7]"
              >
                <td className="px-[22px] py-[13px] text-[13.5px]">{inv.id}</td>
                <td className="px-[22px] py-[13px] text-[13.5px]">{inv.client}</td>
                <td className="px-[22px] py-[13px] font-mono text-[13.5px] [font-variant-numeric:tabular-nums]">
                  {inv.amount}
                </td>
                <td className="px-[22px] py-[13px]">
                  <span
                    className={`inline-block rounded-full px-[10px] py-1 text-[11.5px] ${STATUS_CLASS[inv.status]}`}
                  >
                    {inv.status}
                  </span>
                </td>
                <td className="px-[22px] py-[13px] text-[13.5px]">{inv.age}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
