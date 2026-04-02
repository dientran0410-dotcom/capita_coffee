import { ReactNode } from "react";
import StaffSidebar from "../staff/StaffSideBar";
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