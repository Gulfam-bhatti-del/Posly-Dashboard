import TransfersList from "@/components/transfers-list"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

export default function TransfersPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <ToastContainer position="top-right" />
      <TransfersList />
    </div>
  )
}
