class JS2::Doc::FileHandler < JS2::Util::FileHandler

  def outfile (file)
    return file.sub(/^#{@js2_dir}/, @out_dir).sub(/\.js2$/, '.js2doc')
  end

end
