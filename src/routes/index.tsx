import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Search,
  Star,
  Phone,
  Clock,
  ShoppingCart,
  Plus,
  Minus,
  UtensilsCrossed,
  X,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

// ─── Tipos ──────────────────────────────────────────────
type Categoria = "topo" | "hamburgueres" | "porcoes" | "bebidas";

interface Produto {
  id: number;
  nome: string;
  descricao: string;
  preco: number;
  precoAntigo?: number;
  categoria: Categoria;
  imagem?: string;
  destaque?: boolean;
  novidade?: boolean;
  promocao?: boolean;
}

// ─── Dados do Cardápio ──────────────────────────────────
const produtos: Produto[] = [
  // Topo
  { id: 1, nome: "Combo Marvel Especial", descricao: "1 Hambúrguer 150g + Batata frita + Refrigerante 400ml", preco: 39.9, precoAntigo: 49.9, categoria: "topo", destaque: true, promocao: true },
  { id: 2, nome: "Combo Duplo Power", descricao: "2 Hambúrgueres 150g + Batata frita grande + Milkshake", preco: 69.9, categoria: "topo", destaque: true },
  { id: 3, nome: "Combo Casal", descricao: "2 Hambúrgueres Artesanais + 2 Batatas + 2 Bebidas", preco: 79.9, categoria: "topo", destaque: true },
  // Hambúrgueres
  { id: 4, nome: "Marvel Classic", descricao: "Hambúrguer 150g, queijo cheddar, alface, tomate e molho especial da casa", preco: 25.9, categoria: "hamburgueres", destaque: true },
  { id: 5, nome: "Double Marvel", descricao: "Dois hambúrgueres 150g, duplo queijo, bacon crocante e cebola caramelizada", preco: 34.9, categoria: "hamburgueres", promocao: true, precoAntigo: 39.9 },
  { id: 6, nome: "Marvel Bacon Supreme", descricao: "Hambúrguer 200g, muito bacon, queijo prato derretido, alface e tomate", preco: 32.9, categoria: "hamburgueres", novidade: true },
  { id: 7, nome: "Smash Burger", descricao: "Dois smash burgers 90g, queijo, picles e molho secreto", preco: 28.9, categoria: "hamburgueres" },
  { id: 8, nome: "Marvel Veggie", descricao: "Hambúrguer de grão de bico, rúcula, tomate seco e molho de iogurte", preco: 26.9, categoria: "hamburgueres" },
  // Porções
  { id: 9, nome: "Batata Frita Clássica", descricao: "Porção generosa de batatas fritas crocantes com sal e orégano", preco: 15.9, categoria: "porcoes" },
  { id: 10, nome: "Batata com Cheddar e Bacon", descricao: "Batata frita coberta com cheddar cremoso e bacon crocante", preco: 22.9, categoria: "porcoes", destaque: true },
  { id: 11, nome: "Onion Rings", descricao: "Anéis de cebola empanados e fritos, servidos com molho barbecue", preco: 18.9, categoria: "porcoes" },
  { id: 12, nome: "Nuggets (10 unidades)", descricao: "Nuggets crocantes de frango, perfeitos para compartilhar", preco: 19.9, categoria: "porcoes" },
  // Bebidas
  { id: 13, nome: "Coca-Cola 350ml", descricao: "Lata gelada", preco: 6.9, categoria: "bebidas" },
  { id: 14, nome: "Guaraná Antarctica 350ml", descricao: "Lata gelada", preco: 6.9, categoria: "bebidas" },
  { id: 15, nome: "Milkshake Morango", descricao: "Milkshake cremoso de morango 400ml", preco: 14.9, categoria: "bebidas", destaque: true },
  { id: 16, nome: "Suco Natural de Laranja", descricao: "Suco natural 500ml", preco: 9.9, categoria: "bebidas" },
];

const categorias: { id: Categoria; label: string }[] = [
  { id: "topo", label: "🔥 Topo" },
  { id: "hamburgueres", label: "🍔 Hambúrgueres" },
  { id: "porcoes", label: "🍟 Porções" },
  { id: "bebidas", label: "🥤 Bebidas" },
];

// ─── Componente Principal ───────────────────────────────
export const Route = createFileRoute("/")({
  component: VerificationPage,
});

function VerificationPage() {
  const [busca, setBusca] = useState("");
  const [categoriaAtiva, setCategoriaAtiva] = useState<Categoria | "todos">("todos");
  const [carrinho, setCarrinho] = useState<Map<number, { qtd: number }>>(new Map());
  const [carrinhoAberto, setCarrinhoAberto] = useState(false);

  // Carrinho helpers
  const adicionarAoCarrinho = (produto: Produto) => {
    const novoCarrinho = new Map(carrinho);
    const atual = novoCarrinho.get(produto.id)?.qtd || 0;
    novoCarrinho.set(produto.id, { qtd: atual + 1 });
    setCarrinho(novoCarrinho);
  };

  const removerDoCarrinho = (id: number) => {
    const novoCarrinho = new Map(carrinho);
    const atual = novoCarrinho.get(id)?.qtd || 0;
    if (atual <= 1) {
      novoCarrinho.delete(id);
    } else {
      novoCarrinho.set(id, { qtd: atual - 1 });
    }
    setCarrinho(novoCarrinho);
  };

  const totalItens = Array.from(carrinho.values()).reduce((acc, item) => acc + item.qtd, 0);
  const valorTotal = Array.from(carrinho.entries()).reduce(
    (acc, [id, { qtd }]) => {
      const prod = produtos.find((p) => p.id === id);
      return acc + (prod?.preco || 0) * qtd;
    },
    0
  );

  // Filtrar produtos
  const filtrados = produtos.filter((p) => {
    const matchBusca = p.nome.toLowerCase().includes(busca.toLowerCase()) || p.descricao.toLowerCase().includes(busca.toLowerCase());
    const matchCat = categoriaAtiva === "todos" || p.categoria === categoriaAtiva;
    return matchBusca && matchCat;
  });

  const maisPedidos = produtos.filter((p) => p.destaque).slice(0, 3);

  // Placeholder SVG
  const PlaceholderIcon = () => (
    <div className="w-full h-full bg-gray-800 rounded-lg flex items-center justify-center">
      <UtensilsCrossed className="w-8 h-8 text-gray-500" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* ─── BANNER + LOGO ─────────────────────────────── */}
      <div className="relative w-full h-56 sm:h-64 md:h-72 overflow-hidden bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">
        <img
          src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80"
          alt="Hambúrguer"
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-purple-900/80 via-transparent to-purple-900/40" />
        
        {/* Logo circular */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white shadow-2xl border-4 border-purple-600 flex items-center justify-center overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1585325701165-351af67fad37?w=200&q=80"
              alt="Logo Marvel Burguer"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* ─── INFO DA LOJA ──────────────────────────────── */}
      <div className="px-4 pt-20 pb-4 bg-white">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-center text-purple-900 mb-2">Marvel Burguer</h1>
          
          <div className="flex items-center justify-center gap-4 text-sm text-gray-600 mb-3">
            <span className="flex items-center gap-1 text-green-600 font-semibold">
              <Clock className="w-4 h-4" /> Aberto agora
            </span>
            <span>Pedido mín: R$ 15,00</span>
            <span className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" /> 4.8
            </span>
          </div>

          <p className="text-center text-gray-500 text-sm mb-4">
            Bem-vindo ao Marvel Burguer! Os melhores hambúrgueres artesanais da cidade. Peça já o seu!
          </p>

          <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
            <Phone className="w-4 h-4" />
            <span>(11) 99999-9999</span>
          </div>
        </div>
      </div>

      {/* ─── BARRA DE BUSCA ────────────────────────────── */}
      <div className="px-4 py-3 bg-white border-b sticky top-0 z-30 shadow-sm">
        <div className="max-w-2xl mx-auto relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Digite para buscar um item"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-10 pr-4 bg-gray-100 border-0 rounded-xl h-11"
          />
        </div>
      </div>

      {/* ─── MENU DE CATEGORIAS ────────────────────────── */}
      <div className="px-4 py-3 bg-white border-b">
        <ScrollArea className="w-full">
          <div className="flex gap-2 min-w-max">
            <button
              onClick={() => setCategoriaAtiva("todos")}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                categoriaAtiva === "todos"
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-200"
                  : "bg-purple-100 text-purple-700 hover:bg-purple-200"
              }`}
            >
              Todos
            </button>
            {categorias.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoriaAtiva(cat.id)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                  categoriaAtiva === cat.id
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-200"
                    : "bg-purple-100 text-purple-700 hover:bg-purple-200"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* ─── CONTEÚDO PRINCIPAL ────────────────────────── */}
      <div className="px-4 py-4 max-w-2xl mx-auto">
        {/* Mais Pedidos */}
        {!busca && categoriaAtiva === "todos" && (
          <section className="mb-6">
            <h2 className="text-lg font-bold text-gray-800 mb-3">🔥 Mais Pedidos</h2>
            <ScrollArea className="w-full">
              <div className="flex gap-3 pb-2">
                {maisPedidos.map((prod) => (
                  <Card key={prod.id} className="min-w-[160px] max-w-[180px] bg-white shadow-md border-0 overflow-hidden">
                    <div className="relative aspect-square">
                      {prod.imagem ? (
                        <img src={prod.imagem} alt={prod.nome} className="w-full h-full object-cover" />
                      ) : (
                        <PlaceholderIcon />
                      )}
                      {prod.promocao && (
                        <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                          Promoção!
                        </div>
                      )}
                      {prod.novidade && (
                        <div className="absolute top-2 left-2 bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                          Novidade!
                        </div>
                      )}
                    </div>
                    <CardContent className="p-3">
                      <h3 className="font-bold text-sm text-gray-800 line-clamp-1">{prod.nome}</h3>
                      <p className="text-purple-600 font-bold text-base mt-1">
                        R$ {prod.preco.toFixed(2).replace(".", ",")}
                      </p>
                      {prod.precoAntigo && (
                        <p className="text-gray-400 text-xs line-through">
                          R$ {prod.precoAntigo.toFixed(2).replace(".", ",")}
                        </p>
                      )}
                      <Button
                        size="sm"
                        className="w-full mt-2 bg-red-500 hover:bg-red-600 text-white text-xs"
                        onClick={() => adicionarAoCarrinho(prod)}
                      >
                        Pedir
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </section>
        )}

        {/* Lista de Produtos */}
        <div className="space-y-4">
          {filtrados.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-lg font-medium">Nenhum item encontrado</p>
              <p className="text-sm">Tente buscar por outro termo</p>
            </div>
          )}

          {filtrados.map((prod) => (
            <Card key={prod.id} className="bg-white shadow-md border-0 overflow-hidden">
              <div className="flex gap-3 p-3">
                {/* Imagem */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 relative">
                  {prod.imagem ? (
                    <img src={prod.imagem} alt={prod.nome} className="w-full h-full object-cover" />
                  ) : (
                    <PlaceholderIcon />
                  )}
                  {prod.promocao && (
                    <div className="absolute top-1 left-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      Promoção!
                    </div>
                  )}
                  {prod.novidade && (
                    <div className="absolute top-1 left-1 bg-purple-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      Novidade!
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-800 text-sm sm:text-base">{prod.nome}</h3>
                  <p className="text-gray-500 text-xs sm:text-sm mt-0.5 line-clamp-2 leading-relaxed">
                    {prod.descricao}
                  </p>
                  <div className="mt-2">
                    <span className="text-purple-600 font-bold text-base sm:text-lg">
                      R$ {prod.preco.toFixed(2).replace(".", ",")}
                    </span>
                    {prod.precoAntigo && (
                      <span className="text-gray-400 text-xs line-through ml-2">
                        R$ {prod.precoAntigo.toFixed(2).replace(".", ",")}
                      </span>
                    )}
                  </div>
                </div>

                {/* Botão Pedir */}
                <div className="flex flex-col items-end justify-between">
                  <Button
                    size="sm"
                    className="bg-red-500 hover:bg-red-600 text-white text-xs sm:text-sm px-4 py-2"
                    onClick={() => adicionarAoCarrinho(prod)}
                  >
                    Pedir
                  </Button>
                  {carrinho.has(prod.id) && (
                    <div className="flex items-center gap-2 mt-2 bg-purple-600 text-white rounded-lg px-2 py-1">
                      <button
                        onClick={() => removerDoCarrinho(prod.id)}
                        className="w-5 h-5 flex items-center justify-center hover:bg-purple-700 rounded"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-sm font-bold">{carrinho.get(prod.id)?.qtd}</span>
                      <button
                        onClick={() => adicionarAoCarrinho(prod)}
                        className="w-5 h-5 flex items-center justify-center hover:bg-purple-700 rounded"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* ─── BOTÃO FLUTUANTE DO CARRINHO ───────────────── */}
      {totalItens > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-40 max-w-2xl mx-auto">
          <button
            onClick={() => setCarrinhoAberto(true)}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-2xl shadow-purple-300 px-6 py-4 flex items-center justify-between transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-full w-10 h-10 flex items-center justify-center">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="font-bold text-sm">{totalItens} {totalItens === 1 ? 'item' : 'itens'}</p>
                <p className="text-xs opacity-80">Ver carrinho</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-lg">R$ {valorTotal.toFixed(2).replace(".", ",")}</p>
              <ChevronRight className="w-5 h-5 inline-block ml-1" />
            </div>
          </button>
        </div>
      )}

      {/* ─── PAINEL DO CARRINHO ────────────────────────── */}
      {carrinhoAberto && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setCarrinhoAberto(false)} />
          <div className="relative w-full max-w-md bg-white shadow-2xl flex flex-col h-full animate-in slide-in-from-right">
            {/* Header */}
            <div className="bg-purple-600 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShoppingCart className="w-6 h-6" />
                <h2 className="text-lg font-bold">Seu Pedido</h2>
              </div>
              <button
                onClick={() => setCarrinhoAberto(false)}
                className="w-8 h-8 flex items-center justify-center hover:bg-purple-700 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Items */}
            <ScrollArea className="flex-1 p-4">
              {Array.from(carrinho.entries()).length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <ShoppingCart className="w-16 h-16 mx-auto mb-3 opacity-30" />
                  <p className="text-lg font-medium">Carrinho vazio</p>
                  <p className="text-sm">Adicione itens do cardápio</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Array.from(carrinho.entries()).map(([id, { qtd }]) => {
                    const prod = produtos.find((p) => p.id === id);
                    if (!prod) return null;
                    return (
                      <div key={id} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                          {prod.imagem ? (
                            <img src={prod.imagem} alt={prod.nome} className="w-full h-full object-cover" />
                          ) : (
                            <PlaceholderIcon />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm text-gray-800 truncate">{prod.nome}</h4>
                          <p className="text-purple-600 font-bold text-sm">
                            R$ {(prod.preco * qtd).toFixed(2).replace(".", ",")}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <button
                              onClick={() => removerDoCarrinho(id)}
                              className="w-7 h-7 flex items-center justify-center bg-white border border-gray-300 rounded-full hover:bg-gray-100"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-sm font-bold w-6 text-center">{qtd}</span>
                            <button
                              onClick={() => adicionarAoCarrinho(prod)}
                              className="w-7 h-7 flex items-center justify-center bg-purple-600 text-white rounded-full hover:bg-purple-700"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            const novo = new Map(carrinho);
                            novo.delete(id);
                            setCarrinho(novo);
                          }}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>

            {/* Footer */}
            {Array.from(carrinho.entries()).length > 0 && (
              <div className="border-t bg-gray-50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-bold text-lg">R$ {valorTotal.toFixed(2).replace(".", ",")}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>Taxa de entrega</span>
                  <span>R$ 5,00</span>
                </div>
                <div className="flex items-center justify-between font-bold text-lg text-purple-900 pt-2 border-t">
                  <span>Total:</span>
                  <span>R$ {(valorTotal + 5).toFixed(2).replace(".", ",")}</span>
                </div>
                <Button className="w-full bg-green-500 hover:bg-green-600 text-white py-6 rounded-xl text-lg font-bold">
                  Finalizar Pedido
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
