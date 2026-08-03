// declaraction of document.ready() function.
(function () {
    var ie = !!(window.attachEvent && !window.opera);
    var wk = /webkit\/(\d+)/i.test(navigator.userAgent) && (RegExp.$1 < 525);
    var fn = [];
    var run = function () {
        for (var i = 0; i < fn.length; i++) fn[i]();
    };
    var d = document;
    d.ready = function (f) {
        if (!ie && !wk && d.addEventListener)
            return d.addEventListener('DOMContentLoaded', f, false);
        if (fn.push(f) > 1) return;
        if (ie)
            (function () {
                try {
                    d.documentElement.doScroll('left');
                    run();
                } catch (err) {
                    setTimeout(arguments.callee, 0);
                }
            })();
        else if (wk)
            var t = setInterval(function () {
                if (/^(loaded|complete)$/.test(d.readyState))
                    clearInterval(t), run();
            }, 0);
    };
})();


document.ready(
    () => {
        const searchInput = document.getElementById('search-input');
        const searchBtn = document.getElementById('search-btn');
        if (searchInput) {
            const performSearch = () => {
                const keyword = searchInput.value.trim().toLowerCase();
                if (keyword) {
                    window.location.href = `/archives/?s=${encodeURIComponent(keyword)}`;
                }
            };
            searchBtn?.addEventListener('click', performSearch);
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') performSearch();
            });
        }

        const archiveSearchInput = document.getElementById('archive-search-input');
        const archiveSearchBtn = document.getElementById('archive-search-btn');
        const archiveContent = document.getElementById('archive-content');
        const noResults = document.getElementById('no-results');
        const yearBtns = document.querySelectorAll('.year-btn');

        // 当前生效的筛选条件
        let currentYear = document.querySelector('.year-btn.active')?.getAttribute('data-year') || 'all';

        const filterArchiveContent = () => {
            if (!archiveContent || !noResults) return;

            const keyword = archiveSearchInput?.value.trim().toLowerCase() || '';
            let hasResults = false;

            archiveContent.querySelectorAll('.archive-news-card').forEach(card => {
                const cardYear = card.getAttribute('data-year');

                // 年份筛选
                const passYear = currentYear === 'all' || cardYear === currentYear;

                // 搜索筛选
                let passSearch = true;
                if (keyword) {
                    const title = card.querySelector('.news-title')?.textContent.toLowerCase() || '';
                    const excerpt = card.querySelector('.news-excerpt')?.textContent.toLowerCase() || '';
                    const category = card.querySelector('.news-category')?.textContent.toLowerCase() || '';
                    passSearch = title.includes(keyword) || excerpt.includes(keyword) || category.includes(keyword);
                }

                if (passYear && passSearch) {
                    // 如果之前是隐藏的，用动画显示
                    const wasHidden = card.style.display === 'none';
                    card.style.display = 'block';
                    hasResults = true;
                    if (wasHidden) {
                        card.style.opacity = '0';
                        requestAnimationFrame(() => {
                            card.animate([
                                { opacity: 0, transform: 'translateY(20px)' },
                                { opacity: 1, transform: 'translateY(0)' }
                            ], { duration: 400, easing: 'ease' });
                            card.style.opacity = '';
                        });
                    }
                } else {
                    card.style.display = 'none';
                }
            });

            archiveContent.querySelectorAll('.archive-year-bar').forEach(bar => {
                const barYear = bar.getAttribute('data-year');
                // 选中具体年份时移除 year-bar 彩带，只有"全部"才保留作为分隔
                const showBar = currentYear === 'all';
                const hasVisibleCard = showBar && archiveContent.querySelector(`.archive-news-card[data-year="${barYear}"][style*="display: block"]`);
                bar.style.display = hasVisibleCard ? 'flex' : 'none';
            });

            archiveContent.style.display = hasResults ? 'block' : 'none';
            noResults.style.display = hasResults ? 'none' : 'block';
        };

        if (archiveSearchInput) {
            archiveSearchBtn?.addEventListener('click', filterArchiveContent);
            archiveSearchInput.addEventListener('input', filterArchiveContent);
            archiveSearchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') filterArchiveContent();
            });

            // 从 URL 查询参数 ?s=keyword 读取搜索关键词
            const urlParams = new URLSearchParams(window.location.search);
            const searchKeyword = urlParams.get('s');
            if (searchKeyword) {
                archiveSearchInput.value = searchKeyword;
            }
        }

        if (yearBtns.length > 0) {
            yearBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    yearBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    currentYear = btn.getAttribute('data-year');
                    filterArchiveContent();
                });
            });
        }

        // 页面加载后执行一次筛选（默认停在最新年份）
        filterArchiveContent();

        const progressBar = document.getElementById('progress-bar');
        if (progressBar) {
            window.addEventListener('scroll', () => {
                const scrollTop = window.pageYOffset;
                const docHeight = document.documentElement.scrollHeight - window.innerHeight;
                const scrollPercent = (scrollTop / docHeight) * 100;
                progressBar.style.width = `${scrollPercent}%`;
            });
        }

        const statNumbers = document.querySelectorAll('.stat-number');
        if (statNumbers.length > 0) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const target = parseInt(entry.target.getAttribute('data-target')) || 0;
                        const duration = 2000;
                        const steps = 60;
                        const increment = target / steps;
                        let current = 0;
                        
                        const timer = setInterval(() => {
                            current += increment;
                            if (current >= target) {
                                current = target;
                                clearInterval(timer);
                            }
                            entry.target.textContent = Math.floor(current).toString();
                        }, duration / steps);
                        
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.5 });

            statNumbers.forEach(num => observer.observe(num));
        }

        // ===== 文章页:复制链接 / 微信二维码 / 回到顶部 =====
        const shareToast = document.getElementById('share-toast');
        let toastTimer = null;
        const showToast = (msg) => {
            if (!shareToast) return;
            if (msg) shareToast.textContent = msg;
            shareToast.classList.add('show');
            clearTimeout(toastTimer);
            toastTimer = setTimeout(() => shareToast.classList.remove('show'), 2200);
        };

        const copyBtn = document.querySelector('.share-copy');
        if (copyBtn) {
            copyBtn.addEventListener('click', async () => {
                const url = copyBtn.getAttribute('data-url') || window.location.href;
                try {
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        await navigator.clipboard.writeText(url);
                    } else {
                        const ta = document.createElement('textarea');
                        ta.value = url;
                        ta.style.position = 'fixed';
                        ta.style.opacity = '0';
                        document.body.appendChild(ta);
                        ta.select();
                        document.execCommand('copy');
                        document.body.removeChild(ta);
                    }
                    showToast('链接已复制到剪贴板');
                } catch (err) {
                    showToast('复制失败,请手动复制');
                }
            });
        }

        const wechatBtn = document.querySelector('.share-wechat');
        const wechatQr = document.getElementById('wechat-qr');
        if (wechatBtn && wechatQr) {
            const qrImg = wechatQr.querySelector('img');
            wechatBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const url = wechatBtn.getAttribute('data-url') || window.location.href;
                const isHidden = wechatQr.hasAttribute('hidden');
                if (isHidden) {
                    if (qrImg && !qrImg.src) {
                        qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&margin=8&data=${encodeURIComponent(url)}`;
                    }
                    wechatQr.removeAttribute('hidden');
                } else {
                    wechatQr.setAttribute('hidden', '');
                }
            });
            document.addEventListener('click', (e) => {
                if (!wechatQr.hasAttribute('hidden') && !wechatBtn.contains(e.target) && !wechatQr.contains(e.target)) {
                    wechatQr.setAttribute('hidden', '');
                }
            });
        }

        const backTopBtn = document.getElementById('btn-back-to-top');
        if (backTopBtn) {
            backTopBtn.addEventListener('click', (e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }
    }
);
