'use client';

/**
 * Lê ?o=<idDaOferta>, mostra o destino e encaminha. O destino aparece ANTES de
 * sair: ninguém é redirecionado às cegas (D-16). Oferta inexistente não vira
 * erro feio — vira caminho de volta.
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ofertaPorId, dataLegivel } from '@/componentes/dados-ofertas';
import { materialPorId } from '@/componentes/dados-materiais';
import { brl } from '@/componentes/formato';
import estilos from './ir.module.css';

/** Respeita quem prefere menos movimento: sem auto-redirect, só o botão. */
const ATRASO_MS = 1200;

export function IrCliente() {
  const parametros = useSearchParams();
  const oferta = ofertaPorId(parametros.get('o') ?? '');
  const material = oferta ? materialPorId(oferta.materialId) : undefined;
  const [encaminhando, setEncaminhando] = useState(false);

  useEffect(() => {
    if (!oferta) return;
    const reduzir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduzir) return; // quem pediu menos movimento clica no botão
    setEncaminhando(true);
    const t = setTimeout(() => window.location.replace(oferta.url), ATRASO_MS);
    return () => clearTimeout(t);
  }, [oferta]);

  if (!oferta) {
    return (
      <main className={`container ${estilos.pagina}`}>
        <h1 className={estilos.titulo}>Oferta não encontrada</h1>
        <p className={estilos.material}>
          Este link de saída não corresponde a nenhuma oferta ativa — provavelmente ela saiu do ar
          ou o endereço veio incompleto.
        </p>
        <Link href="/catalogo/" className="botao-primario">
          Ir para o catálogo
        </Link>
      </main>
    );
  }

  return (
    <main className={`container ${estilos.pagina}`}>
      <p className={`mono ${estilos.status}`}>
        {encaminhando ? 'Levando você para a loja…' : 'Pronto para ir à loja'}
      </p>
      <h1 className={estilos.titulo}>{oferta.loja}</h1>
      {material && (
        <p className={estilos.material}>
          {material.nome} — {material.marca} · <span className="mono">{brl(oferta.preco)}</span>{' '}
          <span className={estilos.checado}>(checado em {dataLegivel(oferta.atualizadoEm)})</span>
        </p>
      )}

      <a href={oferta.url} className="botao-primario" rel="nofollow sponsored noopener">
        Continuar para {oferta.loja} ↗
      </a>

      <p className={estilos.destino}>
        Destino: <span className="mono">{oferta.url}</span>
      </p>

      {oferta.parceiro && (
        <p className={estilos.aviso}>
          Esta loja é <strong>parceira</strong>: se você comprar, recebemos comissão. Isso não muda
          a ordem das ofertas (que é por preço) nem o conteúdo da ficha técnica, que é
          independente.
        </p>
      )}

      <p className={estilos.voltar}>
        {material ? (
          <Link href={`/materiais/${material.id}/`}>← Voltar para a ficha</Link>
        ) : (
          <Link href="/catalogo/">← Voltar para o catálogo</Link>
        )}
      </p>
    </main>
  );
}
