
let mazo = [
  { codigo: "B001",
    texto: "La comunidad de inmigrantes te pide beneficios sociales",
    imagen: "B001.jpg",
    opciones:[
      { texto: "Aprobar",  consecuencias:[ 2, 0,-2, 0]},
      { texto: "Rechazar", consecuencias:[-2, 0, 0, 0]},
    ]
  },
  { codigo: "B002",
    texto: "Un empresario de una pesquera...",
    imagen: "B002.jpg",
    opciones:[
      { texto: "Aceptar",    consecuencias:[ 2, 0,-2, 0]},
      { texto: "No aceptar", consecuencias:[-2, 0, 0, 0]},
    ]
  },
  { codigo: "B003",
    texto: "La campaña de vacunación...",
    imagen: "B003.jpg",
    opciones:[
      { texto: "Aceptar",    consecuencias:[ 2, 0,-2, 0]},
      { texto: "No aceptar", consecuencias:[-2, 0, 0, 0]},
      { texto: "Postergar",  consecuencias:[ 0, 0, 0, 0]},
    ]
  }
];

let estado = {
  current: undefined,
  factores: [],
  mazo: undefined,
}


const urlParams = new URLSearchParams(window.location.search);

splash();

function splash(){
  const script = document.createElement('script');
  script.onload = () => {};
  script.src = `https://spreadsheets.google.com/feeds/cells/${urlParams.get("id")}/1/public/values?alt=json-in-script&callback=procesarDatos`;
  document.head.appendChild(script);

  document.getElementById("start").hidden = false;
  document.getElementById("decision").hidden = true;
  document.getElementById("estado").hidden = true;
  
}

function iniciar(){
  console.log("Juego iniciado");

  // Inicia los factores
  let elemHtml = "";  
  for (let i = 0; i < factores.length; i++) {
    estado.factores[i] = valor_inicial;
    elemHtml += `<progress id="factor${i}" class="barrajuego factor${i}" value="${valor_inicial}" max="10"></progress>`;
  }
  document.getElementById("estado").innerHTML = elemHtml;

  // Carga y baraja el mazo.
  estado.mazo = [...mazo];
  shuffle(estado.mazo);
  console.log(estado.mazo);

  document.getElementById("start").hidden = true;
  document.getElementById("decision").hidden = false;
  document.getElementById("estado").hidden = false;

  siguiente(estado);
}

function siguiente(estado){
  console.log("Carta siguiente");

  estado.current = estado.mazo.shift();

  if(estado.current){
    mostrar(estado.current);
  } else {
    victoria();
  }
}

function decidir(opcion){
  console.log("Se eligió la opción " + opcion);
  
  // Aplicar consecuencias.
  const cons = consecuencias(estado, opcion);

  let go = 1;
  for(let i = 0; i < cons.length; i++){
    estado.factores[i] = actualizar(i, estado.factores[i], cons[i]);
    go *= estado.factores[i];
  }

  if (go == 0){
    gameover();
  } else {
    siguiente(estado);
  }
}

function gameover(){
  console.log("Game over");
  document.getElementById("decision").hidden = true;
  alert("Game over");
}


function victoria() {
  console.log("Victoria!");
  document.getElementById("decision").hidden = true;
  alert("Victoria!");
}

function consecuencias(estado, opcion){
  return estado.current.opciones[opcion].consecuencias;
}

function mostrar(carta) {
  const texto = document.getElementById("texto");
  const imag = document.getElementById("imag");

  const opciones = document.getElementById("opciones");
    
  texto.innerHTML = carta.texto;
  imag.src = "imagenes/"+carta.imagen;

  let opcionesHtml = "";
  for(let i = 0; i < carta.opciones.length; i++){
    let op = carta.opciones[i];
    opcionesHtml += `<button onclick="decidir(${i})">${op.texto}</button>`;
  }
  opciones.innerHTML = opcionesHtml;
}

// Mezcla el mazo aleatoreamente.
function shuffle(mazo){
  for(let i = 0; i < mazo.length; i++){
    let j = Math.floor(Math.random() * mazo.length);
    let aux = mazo[i];
    mazo[i] = mazo[j];
    mazo[j] = aux;
  }
}

function actualizar(i, valor, incremento) {

  if(incremento == 0) return valor;

  let e = document.getElementById(`factor${i}`);
  const target = Math.min(Math.max(valor + incremento, 0), 10);
  
  const inter = setInterval(() => {
      if(Math.abs(valor - target) < 0.15){
        e.value = target;
        clearInterval(inter);
      } else {
        valor += 0.1 * Math.sign(incremento);
        e.value = valor;
      }
    },5);
  
  return target;
}

function groupByRow(xs) {
  return xs.reduce((rv, x) => {
    (rv[parseInt(x.row) - 2] = rv[parseInt(x.row) - 2] || []).push(x.$t);
    return rv;
  }, []);
};

function parseConsecuencias(consecuencias){
  const regexp = /(\w+)\ *([\+|\-][0-9]*)/ig;

  console.log(consecuencias);

  let rs = [0,0,0,0];

  for(c of consecuencias.matchAll(regexp)){
    rs[factores.indexOf(c[1].toLowerCase())] = parseInt(c[2]);
  }
  
  console.log(rs);

  return rs;
}

function parseOpciones(row){
  let rs = [];

  while(row.length > 1){
    rs.push({
      texto: row.shift(), 
      consecuencias:parseConsecuencias(row.shift())
    });
  }

  return rs;
}

function procesarDatos(json){

  let data = groupByRow(
    json.feed.entry
    .map(e => e.gs$cell)
    .filter(e => e.row != "1")
    );

  mazo = [...data.map(row => ({
    codigo: row.shift(),
    texto: row.shift(),
    imagen: row.shift(),
    opciones: parseOpciones(row)
    }))];
}