import CustomerManagement from "@/components/customers/CustomerManagement";

export const metadata = {
  title: "Customers Directory | NammaFit",
  description: "Customer management and body measurement ledger.",
};

export default function CustomersPage() {
  return <CustomerManagement />;
}
