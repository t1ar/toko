const express = require('express');
const db = require('./database');
const app = express();

app.use(express.json());
app.use(express.static('public'));

// GET semua produk
app.get('/api/produk', async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT kode, nama, harga, stok FROM produk ORDER BY kode'
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ pesan: 'Gagal mengambil data' });
  }
});

// GET satu produk
app.get('/api/produk/:kode', async (req, res) => {
  const { kode } = req.params;
  if (!/^\d+$/.test(kode)) {
    return res.status(400).json({ pesan: 'Kode tidak valid' });
  }
  try {
    const { rows } = await db.query(
      'SELECT kode, nama, harga, stok FROM produk WHERE kode = $1',
      [kode]
    );
    if (rows.length === 0) {
      return res.status(404).json({ pesan: 'Produk tidak ditemukan' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ pesan: 'Gagal mengambil data' });
  }
});

function validateProduk(body) {
    const { nama, harga, stok } = body ?? {};

    const namaBersih = typeof nama === 'string' ? nama.trim() : '';
    const hargaNum = Number(harga);
    const stokNum = Number(stok);

    if (!namaBersih){
    return {error : 'isi nama'};
    }
    if (harga === '' || harga == null || !Number.isFinite(hargaNum) || hargaNum < 0 || hargaNum > 99999999.99){
    return {error : 'harga harus 0 < x < 99.999.999,99'};
    }
    if (stok === '' || stok == null || !Number.isInteger(stokNum) || stokNum < 0){
    return {error : 'stok harus bilangan asli'};
    }

    return {data : {nama: namaBersih, harga :hargaNum, stok:stokNum}};
}

app.post('/api/produk', async (req, res) => {
    const {error,data} = validateProduk(req.body);
    if (error) return res.status(400).json({pesan: error});

    try {
    const { rows } = await db.query(
        'INSERT INTO produk (nama, harga, stok) VALUES ($1, $2, $3) RETURNING kode, nama, harga, stok',
        [data.nama, data.harga, data.stok]
    );
    res.status(201).json({ pesan: 'Data ditambahkan', data: rows[0] });
    } catch (err) {
    console.error(err);
    res.status(500).json({ pesan: 'Gagal menambahkan data' });
    }
});


app.put('/api/produk/:kode', async (req, res) => {
  const { kode } = req.params;

  if (!/^\d+$/.test(kode)) {
    return res.status(400).json({ pesan: 'Kode tidak valid' });
  }

  const { error, data } = validateProduk(req.body);
  if (error) {
    return res.status(400).json({ pesan: error });
  }

  try {
    const { rows } = await db.query(
      `UPDATE produk
       SET nama = $1, harga = $2, stok = $3
       WHERE kode = $4
       RETURNING kode, nama, harga, stok`,
      [data.nama, data.harga, data.stok, kode]
    );

    if (rows.length === 0) {
      return res.status(404).json({ pesan: 'Produk tidak ditemukan' });
    }

    res.json({ pesan: 'Data diperbarui', data: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ pesan: 'Gagal memperbarui data' });
  }
});

app.delete('/api/produk/:kode', async (req, res) => {
  const { kode } = req.params;

  if (!/^\d+$/.test(kode)) {
    return res.status(400).json({ pesan: 'Kode tidak valid' });
  }

  try {
    const { rows } = await db.query(
      'DELETE FROM produk WHERE kode = $1 RETURNING kode, nama, harga, stok',
      [kode]
    );

    if (rows.length === 0) {
      return res.status(404).json({ pesan: 'Produk tidak ditemukan' });
    }

    res.json({ pesan: 'Data dihapus', data: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ pesan: 'Gagal menghapus data' });
  }
});


app.listen(3000, () => console.log('http://localhost:3000'));