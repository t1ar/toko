const API = '/api/produk';

const form = document.getElementById('formProduk');
const inKode = document.getElementById('kode');
const inNama = document.getElementById('nama');
const inHarga = document.getElementById('harga');
const inStok = document.getElementById('stok');
const judulForm = document.getElementById('judulForm');
const btnSimpan = document.getElementById('btnSimpan');
const btnBatal = document.getElementById('btnBatal');
const isiTabel = document.getElementById('isiTabel');
const pesan = document.getElementById('pesan');

let daftar = [];

const rupiah = n => 'Rp ' + Number(n).toLocaleString('id-ID');

async function panggil(url, opsi) {
    const res = await fetch(url, opsi);
    const hasil = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(hasil.pesan || 'Terjadi kesalahan.');
    return hasil;
}

function buatSel(teks) {
    const td = document.createElement('td');
    td.textContent = teks;
    return td;
}

function buatTombol(teks, kode, aksi) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = teks;
    b.dataset.kode = kode;
    b.dataset.aksi = aksi;
    return b;
}

function gambarTabel() {
    isiTabel.innerHTML = '';
    if (daftar.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 5;
    td.textContent = 'Belum ada barang.';
    tr.appendChild(td);
    isiTabel.appendChild(tr);
    return;
    }

    daftar.forEach(p => {
    const tr = document.createElement('tr');
    tr.appendChild(buatSel(p.kode));
    tr.appendChild(buatSel(p.nama));
    tr.appendChild(buatSel(rupiah(p.harga)));
    tr.appendChild(buatSel(p.stok));

    const tdAksi = document.createElement('td');
    tdAksi.appendChild(buatTombol('Ubah', p.kode, 'ubah'));
    tdAksi.appendChild(buatTombol('Hapus', p.kode, 'hapus'));
    tr.appendChild(tdAksi);

    isiTabel.appendChild(tr);
    });
}

async function muat() {
    daftar = await panggil(API);
    gambarTabel();
}

function resetForm() {
    form.reset();
    inKode.value = '';
    judulForm.textContent = 'Tambah barang';
    btnSimpan.textContent = 'Tambah';
    btnBatal.hidden = true;
}

// Simpan: POST kalau baru, PUT kalau sedang mengubah
form.addEventListener('submit', async e => {
    e.preventDefault();
    pesan.textContent = '';

    const data = {
    nama: inNama.value.trim(),
    harga: Number(inHarga.value),
    stok: Number(inStok.value)
    };
    const mengubah = inKode.value !== '';

    btnSimpan.disabled = true;
    try {
    if (mengubah) {
        await panggil(API + '/' + inKode.value, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
        });
        pesan.textContent = 'Barang diperbarui.';
    } else {
        await panggil(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
        });
        pesan.textContent = 'Barang ditambahkan.';
    }
    resetForm();
    await muat();
    } catch (err) {
    pesan.textContent = err.message;
    } finally {
    btnSimpan.disabled = false;
    }
});

btnBatal.addEventListener('click', () => {
    resetForm();
    pesan.textContent = '';
});

// Tombol Ubah / Hapus di tabel
isiTabel.addEventListener('click', async e => {
    const tombol = e.target.closest('button[data-aksi]');
    if (!tombol) return;

    const kode = tombol.dataset.kode;
    const aksi = tombol.dataset.aksi;
    const barang = daftar.find(p => String(p.kode) === kode);
    if (!barang) return;

    if (aksi === 'ubah') {
    inKode.value = barang.kode;
    inNama.value = barang.nama;
    inHarga.value = Number(barang.harga);
    inStok.value = barang.stok;
    judulForm.textContent = 'Ubah barang (kode ' + barang.kode + ')';
    btnSimpan.textContent = 'Simpan perubahan';
    btnBatal.hidden = false;
    inNama.focus();
    return;
    }

    if (aksi === 'hapus') {
    if (!confirm('Hapus "' + barang.nama + '"?')) return;
    try {
        await panggil(API + '/' + kode, { method: 'DELETE' });
        pesan.textContent = 'Barang dihapus.';
        if (inKode.value === kode) resetForm();
        await muat();
    } catch (err) {
        pesan.textContent = err.message;
    }
    }
});

muat().catch(err => { pesan.textContent = err.message; });