/**
 * FotoProduto — imagem oficial do material num tile neutro, com FALLBACK pro Glifo.
 *
 * Foto de produto vem em fundos variados (branco, transparente); o tile claro faz
 * todas ficarem bem nos DOIS temas, com `object-fit: contain` (nunca corta o produto).
 * Sem imagem aprovada, cai no Glifo tipográfico — nada quebra (D-16). Componente puro
 * (sem hooks): serve tanto na ficha SSG quanto no catálogo cliente.
 */
import { Glifo } from './Glifo';
import { imagemDoMaterial, caminhoImagem } from './dados-imagens';
import estilos from './FotoProduto.module.css';

export function FotoProduto({
  id,
  nome,
  tipo,
  tamanho = 64,
}: {
  id: string;
  nome: string;
  tipo: string;
  tamanho?: number;
}) {
  const img = imagemDoMaterial(id);
  if (!img) return <Glifo tipo={tipo} tamanho={tamanho} />;

  return (
    <span className={estilos.tile} style={{ width: tamanho, height: tamanho }}>
      <img
        src={caminhoImagem(img)}
        alt={nome}
        width={tamanho}
        height={tamanho}
        loading="lazy"
        decoding="async"
        className={estilos.img}
      />
    </span>
  );
}
