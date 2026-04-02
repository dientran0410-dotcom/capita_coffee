import { ReactNode } from "react";
import StaffSidebar from "../staff/StaffSidebar";
import "./StaffLayout.css";

interface Props {
  children: ReactNode;
}

export default function StaffLayout({ children }: Props) {

  return (

    <div className="staff-layout">

      <StaffSidebar />

      <main className="staff-main">
        {children}
      </main>

    </div>

  );
}