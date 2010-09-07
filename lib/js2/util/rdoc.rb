class JS2::Util::Rdoc 

  def self.build (pages, file_handler, rdoc_bin = 'rdoc')
    file_handler.doc_dir = "./.#{Time.now.to_i.to_s}-doc-code"

    pages.each do |p|
      str = ''
      p.klasses.each do |k|
        if k.comment
          str << k.comment.clean.gsub(/^/, "# ") if k.comment
        end
        str << "class #{k.name.gsub(/\./, '::')}\n"
        puts k.name

        k.methods.each_with_index do |m,i|
          puts ' - ' + m.name
          str << m.comment.clean.gsub(/^/, "  # ") if m.comment
          str << "  def #{m.name} (#{m.args})\n#{m.to_s.gsub(/^/, '  #')} end\n"
        end

        str << "end\n"
      end
      
      outfile = file_handler.docfile(p.file)
      outdir  = File.dirname(outfile)
      FileUtils.mkdir_p(outdir)
      File.open(outfile, 'w') { |f| f << str }
    end

    # TODO make this portable
    jamis = File.dirname(__FILE__) + '/jamis.rb'
    puts `#{rdoc_bin} --template #{jamis} --extension js=rb #{file_handler.doc_dir}`
    puts `rm -rf #{file_handler.doc_dir}`
  end


end
