import {
    LayoutDashboard,
    QrCode,
    History,
    User
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import "./StaffSidebar.css";

const menu = [
    {
        id: "dashboard",
        label: "Dashboard",
        icon: <LayoutDashboard size={20} />,
        path: "/staff/dashboard"
    },
    {
        id: "scan",
        label: "QR Verification",
        icon: <QrCode size={20} />,
        path: "/staff/scan"
    },
    {
        id: "history",
        label: "Scan History",
        icon: <History size={20} />,
        path: "/staff/history"
    },
    {
        id: "profile",
        label: "My Profile",
        icon: <User size={20} />,
        path: "/staff/profile"
    },
    {
        id: "order",
        label: "Order Page",
        icon: <User size={20} />,
        path: "/staff/order"
    }
];

export default function StaffSidebar() {

    const location = useLocation();

    return (

        <aside className="staff-sidebar">

            {/* HEADER */}
            <div className="sidebar-header">

                <div className="logo-box">
                    ☕
                </div>

                <div>
                    <h2>Capital Coffee</h2>
                    <p>Staff Portal</p>
                </div>

            </div>


            {/* MENU */}
            <nav className="sidebar-menu">

                {menu.map((item) => {

                    const active = location.pathname === item.path;

                    return (

                        <Link
                            key={item.id}
                            to={item.path}
                            className={`menu-item ${active ? "active" : ""}`}
                        >

                            {item.icon}

                            <span>{item.label}</span>

                        </Link>

                    );

                })}

            </nav>

        </aside>

    );

}