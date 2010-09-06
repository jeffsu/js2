module Haml
  module Filters
    module Js2
      include ::Haml::Filters::Base
      CONFIG = JS2::Util::Config.new

      def render(text)
        page_node = CONFIG.lexer.parse(text, CONFIG.node_factory)
        return %{<script language="JavaScript">#{page_node.to_s}</script>}
      end
    end
  end
end
