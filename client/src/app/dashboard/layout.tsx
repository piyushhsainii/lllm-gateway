import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardBreadcrumb } from "@/components/dashboard/DashboardBreadCrumb";
import { DashboardDataProvider } from "@/context/DashboardDataContext";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <DashboardDataProvider>
            <div className="flex" style={{ height: "100vh", overflow: "hidden" }}>
                <DashboardSidebar />

                <div className="flex flex-col flex-1 overflow-hidden" style={{ marginLeft: "224px" }}>
                    <header
                        className="flex-shrink-0 flex items-center justify-between border-b border-[#e4e2dd]"
                        style={{
                            height: "56px",
                            padding: "0 40px",
                            background: "rgba(250,250,249,0.92)",
                            backdropFilter: "blur(12px)",
                            WebkitBackdropFilter: "blur(12px)",
                        }}
                    >
                        <DashboardBreadcrumb />
                        <div className="flex items-center gap-4">
                            <span
                                className="font-mono uppercase text-[#c94f1a] bg-[#fdf1ec] border border-[#f0cabb] rounded-full"
                                style={{ fontSize: "10px", fontWeight: 500, padding: "3px 12px", letterSpacing: "0.1em" }}
                            >
                                Pro
                            </span>
                            <div
                                className="flex items-center justify-center rounded-full bg-[#1c1b18]"
                                style={{ width: "32px", height: "32px" }}
                            >
                                <span className="font-mono font-medium text-white" style={{ fontSize: "11px" }}>AS</span>
                            </div>
                        </div>
                    </header>

                    <main className="flex-1 overflow-y-auto bg-[#fafaf9]">
                        {children}
                    </main>
                </div>
            </div>
        </DashboardDataProvider>
    );
}