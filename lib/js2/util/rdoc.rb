class JS2::Util::RDoc < JS2::Util::Processor

  def process!
    klasses = []
    @file_handler.get_files(:js2).each do |file|
      page = @lexer.parse_file(file, @factory)
      klasses += page.klasses
    end

    klasses.each do |k|
      str = "= #{k.name}\n" 
      if k.comment
        str << k.comment.clean if k.comment
      end

      k.methods.each_with_index do |m,i|
        str << "= Methods\n" if i == 0
        str << "== #{m.name}"
        str << m.comment.clean if m.comment
      end

      puts str
    end
  end

end
