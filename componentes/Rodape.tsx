import estilos from './Rodape.module.css';

export function Rodape() {
  return (
    <footer className={estilos.rodape}>
      <div className="container">
        WikiPong — enciclopédia PT-BR de tênis de mesa. Feito pra explicar, não pra empurrar.
      </div>
    </footer>
  );
}
