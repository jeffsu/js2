class JS2::FS
  class << self
    def read(file)
      File.read(file)
    end

    def find(dir, ext, recursive) 
      if recursive
        return Dir["**/*.#{ext}"].reject { |f| f == /^./ }
      else
        return Dir.readdir(dir);
      end
    end

    def isDirectory(dir)
      return File.directory?(dir)
    end

    def isFile(dir)
      return File.file?(dir)
    end

    def write(out, data) 
      File.open(out, 'w') { |f| f << data }
    end

    def mtime(file)
      File.stat(file).mtime
    end

    def setInterval(block, time)
      puts block.class.to_s
      while true
        sleep time
        block.call()
      end
    end
  end
end
