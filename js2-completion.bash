_js2 ()
{
  local cur prev opts
  cur="${COMP_WORDS[COMP_CWORD]}"
  prev="${COMP_WORDS[COMP_CWORD-1]}"
  opts="run render compile watch"

  if [[ $COMP_CWORD -eq 1 ]]; then
    COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
    COMP_WORDBREAKS=${COMP_WORDBREAKS//:}
    return 0
  fi
  return 0
}

complete -o bashdefault -o default -F _js2 js2 2>/dev/null \
  || complete -o default -F _js2 js2
