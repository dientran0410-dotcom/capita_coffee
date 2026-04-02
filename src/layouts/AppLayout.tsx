import { Outlet } from "react-router-dom";


const AppLayout = () => {
  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 antialiased">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 flex items-center justify-between whitespace-nowrap border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-10 py-3">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-4 text-slate-900 dark:text-slate-100">
            <div className="size-8 text-primary">
              <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M24 45.8096C19.6865 45.8096 15.4698 44.5305 11.8832 42.134C8.29667 39.7376 5.50128 36.3314 3.85056 32.3462C2.19985 28.361 1.76794 23.9758 2.60947 19.7452C3.451 15.5145 5.52816 11.6284 8.57829 8.5783C11.6284 5.52817 15.5145 3.45101 19.7452 2.60948C23.9758 1.76795 28.361 2.19986 32.3462 3.85057C36.3314 5.50129 39.7376 8.29668 42.134 11.8833C44.5305 15.4698 45.8096 19.6865 45.8096 24L24 24L24 45.8096Z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold leading-tight tracking-[-0.015em]">Capital Coffee</h2>
          </div>
          {/* <label className="hidden md:flex flex-col min-w-40 h-10 max-w-64">
            <div className="flex w-full flex-1 items-stretch rounded-lg h-full">
              <div className="text-slate-500 flex border-none bg-slate-100 dark:bg-slate-800 items-center justify-center pl-4 rounded-l-lg">
                <span className="material-symbols-outlined">search</span>
              </div>
              <input
                className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-r-lg text-slate-900 dark:text-slate-100 focus:outline-none border-none bg-slate-100 dark:bg-slate-800 placeholder:text-slate-500 px-4 text-sm font-normal"
                placeholder="Tìm kiếm sản phẩm..."
              />
            </div>
          </label> */}
        </div>
        <div className="flex flex-1 justify-end gap-8">
          {/* <nav className="flex items-center gap-9">
            <a className="text-sm font-medium leading-normal hover:text-primary transition-colors" href="#">Trang chủ</a>
            <a className="text-sm font-medium leading-normal hover:text-primary transition-colors" href="#">Danh mục</a>
            <a className="text-sm font-medium leading-normal hover:text-primary transition-colors" href="#">Khuyến mãi</a>
          </nav> */}
          <div className="flex gap-2">
            {/* <button className="flex items-center justify-center rounded-lg h-10 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border-0">
              <span className="material-symbols-outlined">shopping_cart</span>
            </button> */}
            <button className="flex items-center justify-center rounded-lg h-10 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border-0">
              <span className="material-symbols-outlined">person</span>
            </button>
          </div>
        </div>
      </header>
    
    {/* Main Content Area */}
    <div className="flex-1">
      <Outlet />
    </div>
    
      {/* ── Footer ── */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-10 py-6 mt-auto">
        <div className="mx-auto max-w-[1280px] flex flex-col md:flex-row items-center justify-between gap-4 text-slate-500 text-xs">
          <div className="flex items-center gap-4">
            <span>© 2024 ShopEase Inc. Bảo lưu mọi quyền.</span>
            <a className="hover:text-primary" href="#">Hỗ trợ</a>
            <a className="hover:text-primary" href="#">Theo dõi đơn hàng</a>
          </div>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">shield</span>
              An toàn &amp; Bảo mật
            </span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">language</span>
              Tiếng Việt
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AppLayout;
