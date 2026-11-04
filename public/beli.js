const API = '/api/produk';

const form = document.getElementById('formBeli');
const pilih = document.getElementById('produk');
const inputJumlah = document.getElementById('jumlah');
const tombol = document.getElementById('btnBeli');
const info = document.getElementById('info');
const pesan = document.getElementById('pesan');

const rupiah = n => 'Rp ' + Number(n).toLocaleString('id-ID');

// GET /api/produk -> isi dropdown
async function muatProduk(kodeDipilih) {
    const res = await fetch(API);
    if (!res.ok) throw new Error('Gagal memuat daftar barang');
    const data = await res.json();

    pilih.innerHTML = '';
    data.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.kode;
    opt.textContent = p.nama + ' - ' + rupiah(p.harga) + ' (stok: ' + p.stok + ')';
    opt.disabled = p.stok <= 0;
    pilih.appendChild(opt);
    });

    if (kodeDipilih) pilih.value = kodeDipilih;
    if (pilih.selectedOptions[0] && pilih.selectedOptions[0].disabled) {
    const tersedia = [...pilih.options].find(o => !o.disabled);
    if (tersedia) pilih.value = tersedia.value;
    }

    const adaStok = [...pilih.options].some(o => !o.disabled);
    tombol.disabled = !adaStok;
    if (data.length === 0) info.textContent = 'Belum ada barang yang dijual.';
    else if (!adaStok) info.textContent = 'Semua barang sedang habis.';
    else info.textContent = '';
}

form.addEventListener('submit', async e => {
    e.preventDefault();
    pesan.textContent = '';

    const kode = pilih.value;
    const jumlah = Number(inputJumlah.value);

    if (!kode) {
    pesan.textContent = 'Pilih barang dulu.';
    return;
    }
    if (!Number.isInteger(jumlah) || jumlah < 1) {
    pesan.textContent = 'Jumlah harus bilangan bulat minimal 1.';
    return;
    }

    tombol.disabled = true;
    try {
    // 1. Ambil data terbaru, cek apakah stoknya masih ada
    const resGet = await fetch(API + '/' + kode);
    if (!resGet.ok) throw new Error('Barang tidak ditemukan.');
    const barang = await resGet.json();

    if (barang.stok < jumlah) {
        throw new Error(
        barang.stok === 0
            ? barang.nama + ' sudah habis.'
            : 'Stok ' + barang.nama + ' hanya tersisa ' + barang.stok + '.'
        );
    }

    // 2. Hitung stok baru, lalu PUT /api/produk/:kode
    const stokBaru = barang.stok - jumlah;
    const resPut = await fetch(API + '/' + kode, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nama: barang.nama, harga: Number(barang.harga), stok: stokBaru })
    });
    const hasil = await resPut.json().catch(() => ({}));
    if (!resPut.ok) throw new Error(hasil.pesan || 'Pembelian gagal (status ' + resPut.status + ').');

    const total = Number(barang.harga) * jumlah;
    pesan.textContent = 'Berhasil membeli ' + jumlah + ' ' + barang.nama +
        '. Total ' + rupiah(total) + '. Sisa stok: ' + stokBaru + '.';
    inputJumlah.value = 1;
    } catch (err) {
    pesan.textContent = err.message;
    } finally {
    try { await muatProduk(kode); } catch (err) { pesan.textContent = err.message; }
    }
});

muatProduk().catch(err => { pesan.textContent = err.message; });