import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { createClient } from '@supabase/supabase-js'


const app = express()
app.use(express.json())


// Variables d'entorn
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY


// Connexió a Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)


//permet cors (cal per fer peticions en local)
app.use(cors())


// Ruta Home: comprova que l’API està activa
app.get('/', (req, res) => {
  res.json({ message: "API CASTELLET connexió OK!" });
});

// Endpoint per crear una nova partida
app.get("/novapartida", async (req, res) => {
  try {
    // 1. Consultem el número actual
    const { data, error: errorSelect } = await supabase
      .from("codipartida")
      .select("numero")
      .limit(1)
      .single()


    if (errorSelect) {
      return res.status(500).json({ error: errorSelect.message })
    }


    const numeroActual = data.numero
    const nouNumero = numeroActual + 1


    // 2. Actualitzem el número (usem eq(numeroActual) per trobar la fila)
    const { error: errorUpdate } = await supabase
      .from("codipartida")
      .update({ numero: nouNumero })
      .eq("numero", numeroActual)


    if (errorUpdate) {
      return res.status(500).json({ error: errorUpdate.message })
    }


    // 3. Retornem el nou número
    res.json({ codiPartida: nouNumero })


  } catch (e) {
    res.status(500).json({ error: "Error intern", detalls: e.message })
  }
})

// Obtenir tots els jugadors
app.get('/jugadors', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('jugadors')
      .select('*'); // seleccionem totes les columnes

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (e) {
    res.status(500).json({ error: "Error intern", detalls: e.message });
  }
});

// Afegir un nou jugador
app.post('/jugadors', async (req, res) => {
  const {
    numeroPartida,
    nomGrup,
    numeroClaus = 0,
    guanyador = 0,
    dataPartida,
    darreraConnexio,
    darreraPosicioX = 0,
    darreraPosicioY = 0
  } = req.body;

  try {
    const { data, error } = await supabase
      .from('jugadors')
      .insert([{
        numeroPartida,
        nomGrup,
        numeroClaus,
        guanyador,
        dataPartida,
        darreraConnexio,
        darreraPosicioX,
        darreraPosicioY
      }])
      .select(); // select retorna l'objecte inserit

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Retornem missatge i dades bàsiques del jugador afegit
    const jugador = data[0];
    res.status(201).json({
      message: "Jugador afegit correctament!",
      idGrup: jugador.idGrup,
      numeroPartida: jugador.numeroPartida,
      nomGrup: jugador.nomGrup
    });

  } catch (e) {
    res.status(500).json({ error: "Error intern", detalls: e.message });
  }
});

// Actualitzar un jugador
app.put('/jugadors/:idGrup', async (req, res) => {
  const { idGrup } = req.params;
  const updateData = req.body; // pot contenir numeroClaus, guanyador, etc.

  try {
    const { data, error } = await supabase
      .from('jugadors')
      .update(updateData)
      .eq('idGrup', idGrup);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ message: "Jugador actualitzat correctament!" });

  } catch (e) {
    res.status(500).json({ error: "Error intern", detalls: e.message });
  }
});

// Esborrar jugadors antics
app.delete('/jugadors/antics', async (req, res) => {
  try {
    // Si no s'envia data → agafem avui en format YYYY-MM-DD
    const dataLimit = req.body?.data || new Date().toISOString().split("T")[0];

    // Convertim a ISO per a Postgres (00:00:00)
    const dataISO = `${dataLimit}T00:00:00.000Z`;

    const { data, error } = await supabase
      .from('jugadors')
      .delete()
      .lt('dataPartida', dataISO);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({
      message: "Jugadors antics eliminats correctament.",
      dataLimit,
      eliminats: data?.length || 0
    });

  } catch (err) {
    res.status(500).json({ error: "Error intern del servidor" });
  }
});


// PORT del servidor: Render assigna la seva variable d’entorn
const PORT = process.env.PORT || 3000;


//INICIAR SERVIDOR
app.listen(PORT, () => {
  console.log(`Servidor escoltant al port ${PORT}`);
});
