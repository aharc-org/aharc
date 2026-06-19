//aharc using Oakwood Framework v4.1.0
class SiteFooter extends HTMLElement {
    connectedCallback() {
        this.render();
    }

    render() {
        this.innerHTML = `
            <footer class="footer-site">
                <div class="footer-item">
                    <p>Alderholt Archives</p>
                </div>
            </footer>
        `;
    }
}

customElements.define('footer-site', SiteFooter);


const fabs = document.querySelectorAll('.fab');

window.addEventListener('scroll', () => {
    fabs.forEach(fab => {
        fab.classList.toggle('fab--visible', window.scrollY > 300);
    });
});

// GoatCounter analytics
const gc = document.createElement('script')
gc.dataset.goatcounter = 'https://alderholtarchives.goatcounter.com/count'
gc.src = '//gc.zgo.at/count.js'
gc.async = true
document.head.appendChild(gc)


